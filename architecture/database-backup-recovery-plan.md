# Database Backup and Recovery Plan

This document outlines the comprehensive backup and recovery strategy for the Sketchy Chain application, including Recovery Point Objectives (RPO) and Recovery Time Objectives (RTO) for different data categories, backup procedures, verification methods, and recovery testing.

## Data Classification and Recovery Objectives

### Data Categories

The application's data is classified into the following categories based on criticality and tolerance for data loss:

| Category | Description | Examples | RPO | RTO |
|----------|-------------|----------|-----|-----|
| **Critical Business Data** | Core data essential for application functionality | Sketches, versions, prompt history | 5 minutes | 1 hour |
| **User Data** | User-related information | User profiles, sessions, preferences | 1 hour | 4 hours |
| **Operational Data** | Metrics, logs, and operational information | System logs, usage statistics | 24 hours | 8 hours |
| **Auxiliary Data** | Non-essential but useful data | Cached results, analytics data | 24 hours | 12 hours |

### Recovery Point Objectives (RPO)

RPO defines the maximum acceptable amount of data loss measured in time:

- **Critical Business Data (5 minutes)**: Near-continuous backup ensures minimal data loss for core application data
- **User Data (1 hour)**: Regular backups with acceptable loss of very recent user profile changes
- **Operational Data (24 hours)**: Daily backups sufficient for system logs and metrics
- **Auxiliary Data (24 hours)**: Daily backups for non-critical data

### Recovery Time Objectives (RTO)

RTO defines the maximum acceptable downtime for recovery:

- **Critical Business Data (1 hour)**: Service for core functionality must be restored within 1 hour
- **User Data (4 hours)**: User authentication and profile services must be restored within 4 hours
- **Operational Data (8 hours)**: Monitoring systems must be recovered within 8 hours
- **Auxiliary Data (12 hours)**: Non-essential services can be restored within 12 hours

## Backup Strategy

The backup strategy employs multiple approaches based on data criticality:

```mermaid
graph TD
    subgraph "Critical Business Data"
        A1[Continuous Replication]
        A2[Hourly Snapshots]
        A3[Daily Full Backups]
    end
    
    subgraph "User Data"
        B1[Hourly Incremental Backups]
        B2[Daily Full Backups]
    end
    
    subgraph "Operational Data"
        C1[Daily Incremental Backups]
        C2[Weekly Full Backups]
    end
    
    subgraph "Auxiliary Data"
        D1[Daily Snapshots]
        D2[Weekly Full Backups]
    end
    
    A1 --> Primary[Primary Storage]
    A2 --> Secondary[Secondary Storage]
    A3 --> Tertiary[Tertiary Storage]
    
    B1 --> Primary
    B2 --> Secondary
    
    C1 --> Secondary
    C2 --> Tertiary
    
    D1 --> Secondary
    D2 --> Tertiary
    
    Primary --> |Immediate Access| Recovery[Recovery Process]
    Secondary --> |Quick Access| Recovery
    Tertiary --> |Archive Access| Recovery
```

### Backup Methods by Data Category

#### Critical Business Data

1. **Continuous Replication**:
   - MongoDB replica sets with at least 3 nodes
   - Synchronous replication to ensure consistency
   - Geographically distributed replicas for disaster recovery

2. **Point-in-Time Recovery**:
   - Transaction log retention enabling restore to any point within the last 24 hours
   - 5-minute interval incremental backups

3. **Daily Snapshots**:
   - Full database snapshots taken daily during off-peak hours
   - Retained for 30 days with weekly snapshots retained for 3 months

#### User Data

1. **Hourly Backups**:
   - Incremental backups every hour
   - Differential backups every 6 hours
   - Full backups daily

2. **Retention Policy**:
   - Hourly backups retained for 24 hours
   - Daily backups retained for 30 days
   - Monthly backups retained for 1 year

#### Operational & Auxiliary Data

1. **Daily Backups**:
   - Incremental backups daily
   - Full backups weekly

2. **Retention Policy**:
   - Daily backups retained for 7 days
   - Weekly backups retained for 30 days
   - Monthly backups retained for 3 months

## Backup Storage Architecture

### Multi-Tier Storage Strategy

```mermaid
graph LR
    Data[Database Servers] --> |Continuous Replication| Hot[Hot Storage]
    Data --> |Hourly/Daily Backups| Warm[Warm Storage]
    Data --> |Weekly/Monthly Backups| Cold[Cold Storage]
    
    subgraph "Primary Datacenter"
        Hot
    end
    
    subgraph "Secondary Datacenter"
        Warm
    end
    
    subgraph "Cloud Archive"
        Cold
    end
```

1. **Hot Storage (Primary)**:
   - High-performance storage for active replicas
   - Located in the primary datacenter
   - Used for immediate failover
   - Retention: 24-48 hours

2. **Warm Storage (Secondary)**:
   - Medium-performance storage for recent backups
   - Located in a secondary datacenter
   - Used for recoveries within 7 days
   - Retention: 30 days

3. **Cold Storage (Archive)**:
   - Cost-optimized storage for long-term retention
   - Cloud-based archival storage
   - Used for compliance and historical recoveries
   - Retention: 1 year or more

### Geographic Distribution

- Primary datacenter: Main application hosting location
- Secondary datacenter: At least 100 miles from primary, different disaster zone
- Cloud storage: Globally distributed object storage (e.g., AWS S3, Google Cloud Storage)

## Backup Process Implementation

### MongoDB Backup Procedures

#### Replica Set Configuration

```javascript
// MongoDB replica set configuration
{
  _id: "promptdesigner-rs",
  members: [
    { _id: 0, host: "mongodb-primary:27017", priority: 2 },
    { _id: 1, host: "mongodb-secondary-1:27017", priority: 1 },
    { _id: 2, host: "mongodb-secondary-2:27017", priority: 1 },
    { _id: 3, host: "mongodb-arbiter:27017", arbiterOnly: true }
  ],
  settings: {
    chainingAllowed: true,
    heartbeatTimeoutSecs: 10,
    electionTimeoutMillis: 10000,
    catchUpTimeoutMillis: 60000
  }
}
```

#### Continuous Backup Configuration

```yaml
# MongoDB Ops Manager / Cloud Manager configuration
backupAgent:
  logPath: /var/log/mongodb-mms-automation/backup-agent.log
  mothership: https://api.cloud.mongodb.com

snapshots:
  - db: promptdesigner
    collection: sketches
    frequency: 6 # hours
    retention: 30 # days
  - db: promptdesigner
    collection: versions
    frequency: 6 # hours
    retention: 30 # days
  - db: promptdesigner
    collection: prompts
    frequency: 6 # hours
    retention: 30 # days
  - db: promptdesigner
    collection: users
    frequency: 24 # hours
    retention: 30 # days

pointInTimeRestore:
  enabled: true
  granularity: 5 # minutes
  retention: 24 # hours
```

#### Backup Script (Example)

```bash
#!/bin/bash
# MongoDB backup script for full and incremental backups

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/mongodb"
DB_NAME="promptdesigner"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR/$TIMESTAMP

# Full backup
mongodump --uri "mongodb://backup-user:password@mongodb:27017/$DB_NAME" \
  --out $BACKUP_DIR/$TIMESTAMP/full \
  --oplog

# Compress backup
tar -czf $BACKUP_DIR/$TIMESTAMP/mongodb_backup_$TIMESTAMP.tar.gz -C $BACKUP_DIR/$TIMESTAMP full

# Copy to secondary storage
aws s3 cp $BACKUP_DIR/$TIMESTAMP/mongodb_backup_$TIMESTAMP.tar.gz s3://promptdesigner-backups/mongodb/

# Clean up old backups
find $BACKUP_DIR -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \;

# Log backup completion
echo "MongoDB backup completed at $(date)" >> /var/log/mongodb-backups.log
```

### Redis Backup Procedures

#### Redis Persistence Configuration

```conf
# Redis persistence configuration
save 900 1      # Save if at least 1 change in 15 minutes
save 300 10     # Save if at least 10 changes in 5 minutes
save 60 10000   # Save if at least 10000 changes in 1 minute

rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb

# Enable AOF for more robust recovery
appendonly yes
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
```

#### Redis Backup Script

```bash
#!/bin/bash
# Redis backup script

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/redis"
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup using SAVE command
redis-cli SAVE

# Copy RDB file
cp /var/lib/redis/dump.rdb $BACKUP_DIR/dump_$TIMESTAMP.rdb

# Compress backup
gzip $BACKUP_DIR/dump_$TIMESTAMP.rdb

# Copy to secondary storage
aws s3 cp $BACKUP_DIR/dump_$TIMESTAMP.rdb.gz s3://promptdesigner-backups/redis/

# Clean up old backups
find $BACKUP_DIR -name "dump_*.rdb.gz" -type f -mtime +$RETENTION_DAYS -delete

# Log backup completion
echo "Redis backup completed at $(date)" >> /var/log/redis-backups.log
```

## Backup Verification and Validation

### Automated Verification Process

1. **Hash Verification**:
   - Calculate SHA-256 checksums before and after transfer
   - Verify checksums match to ensure backup integrity

2. **Restore Testing**:
   - Automatically restore to test environment weekly
   - Run automated tests against restored data
   - Verify application functionality with restored data

3. **Corruption Detection**:
   - Run database consistency checks on backups
   - For MongoDB: use `mongodump --repair` to check for corruption
   - For Redis: verify RDB file integrity using `redis-check-rdb`

### Verification Schedule

| Verification Type | Frequency | Environment | Notification |
|-------------------|-----------|-------------|--------------|
| Checksum Validation | Every backup | Automated | On failure only |
| Test Restoration | Weekly | Test environment | Success and failure |
| Full Recovery Drill | Monthly | DR environment | Full report |
| Application Testing | Weekly | Test environment | Success and failure |

## Recovery Procedures

### Disaster Recovery Process Flow

```mermaid
flowchart TD
    A[Incident Detection] --> B{Assess Impact}
    B -->|Minor| C[Single Component Recovery]
    B -->|Major| D[Full System Recovery]
    B -->|Critical| E[Disaster Recovery]
    
    C --> F[Restore from Recent Backup]
    D --> G[Restore Multiple Components]
    E --> H[Activate DR Site]
    
    F --> I[Verify Recovery]
    G --> I
    H --> I
    
    I -->|Success| J[Resume Operations]
    I -->|Failure| K[Escalate & Try Alternative]
    K --> B
```

### Recovery Methods by Scenario

#### 1. Single Document Recovery

For accidental deletion or corruption of individual documents:

```javascript
// MongoDB Point-in-Time Recovery Example
db.runCommand({
  find: "sketches",
  filter: { _id: ObjectId("60f7a9b8c9e4d42b3c5a2e1f") },
  readConcern: {
    level: "majority",
    afterClusterTime: ISODate("2025-10-18T22:15:30.456Z") // Point in time
  }
})
```

#### 2. Collection Recovery

For recovery of an entire collection:

```bash
# Restore a specific collection from backup
mongorestore --uri "mongodb://admin:password@mongodb:27017" \
  --db promptdesigner \
  --collection sketches \
  --drop \
  /backup/mongodb/20251018_221530/full/promptdesigner/sketches.bson
```

#### 3. Full Database Recovery

For complete database recovery:

```bash
# Full database restore
mongorestore --uri "mongodb://admin:password@mongodb:27017" \
  --drop \
  /backup/mongodb/20251018_221530/full
```

#### 4. Disaster Recovery

For complete site failure:

```bash
# 1. Promote secondary site to primary
mongo admin --host mongodb-secondary-1:27017 -u admin -p password --eval 'rs.stepDown()'

# 2. Update DNS records to point to new primary

# 3. Restore from latest backup if needed
mongorestore --uri "mongodb://admin:password@mongodb-new-primary:27017" \
  --oplogReplay \
  /backup/mongodb/latest/full
```

### Recovery Time Estimation

| Scenario | Data Size | Network Speed | Estimated Time |
|----------|-----------|---------------|----------------|
| Single Document | <1 MB | N/A | <1 minute |
| Single Collection | 1 GB | 10 Gbps | 5-10 minutes |
| Full Database | 10 GB | 10 Gbps | 20-40 minutes |
| Full Disaster Recovery | 100 GB | 1 Gbps | 2-4 hours |

## Recovery Testing and Validation

### Testing Schedule

| Test Type | Frequency | Scope |
|-----------|-----------|-------|
| Single Document Recovery | Weekly | Random document from each critical collection |
| Collection Recovery | Monthly | One critical collection |
| Full Database Recovery | Quarterly | Complete database |
| Disaster Recovery | Bi-annually | Full application stack |

### Test Procedures

1. **Preparation**:
   - Create test restore environment
   - Document baseline metrics and validation criteria
   - Notify stakeholders of planned test

2. **Execution**:
   - Perform recovery according to documented procedures
   - Measure actual recovery time and compare to RTO
   - Validate data integrity and application functionality

3. **Validation**:
   - Run automated tests against recovered data
   - Verify data integrity with consistency checks
   - Confirm application functionality

4. **Documentation**:
   - Record actual RPO/RTO achieved
   - Document any issues or deviations
   - Update procedures based on lessons learned

## Backup and Recovery Monitoring

### Monitoring Metrics

| Metric | Description | Threshold | Alert Priority |
|--------|-------------|-----------|----------------|
| Backup Success Rate | Percentage of successful backups | <95% | High |
| Backup Duration | Time taken to complete backups | >120% of baseline | Medium |
| Backup Size | Size of backup files | >120% of baseline | Medium |
| Time Since Last Successful Backup | For each data category | >RPO | High |
| Backup Storage Utilization | Percentage of allocated storage used | >80% | Medium |
| Restore Test Success Rate | Percentage of successful restore tests | <100% | High |
| Actual Recovery Time | Time taken for recovery tests | >RTO | High |

### Alerting Configuration

```yaml
# Prometheus alerting rules example
groups:
- name: backup_monitoring
  rules:
  - alert: BackupMissed
    expr: time() - backup_last_success_timestamp > backup_rpo_seconds
    for: 5m
    labels:
      severity: high
    annotations:
      summary: "Backup missed for {{ $labels.backup_type }}"
      description: "Backup for {{ $labels.backup_type }} has not completed successfully within the RPO period"

  - alert: BackupDurationHigh
    expr: backup_duration_seconds > backup_duration_baseline_seconds * 1.2
    for: 5m
    labels:
      severity: medium
    annotations:
      summary: "Backup duration high for {{ $labels.backup_type }}"
      description: "Backup for {{ $labels.backup_type }} took longer than expected"

  - alert: BackupStorageHigh
    expr: backup_storage_used_bytes / backup_storage_total_bytes > 0.8
    for: 30m
    labels:
      severity: medium
    annotations:
      summary: "Backup storage utilization high"
      description: "Backup storage utilization is above 80%"
```

## Compliance and Auditing

### Compliance Requirements

| Requirement | Description | Implementation |
|-------------|-------------|----------------|
| Data Retention | Retain backups for required period | Tiered backup strategy with defined retention |
| Access Controls | Limit access to backup data | Role-based access control, encryption |
| Encryption | Encrypt backup data | At-rest and in-transit encryption |
| Audit Logs | Track backup and recovery activities | Comprehensive logging of all operations |
| Testing | Regular recovery testing | Scheduled tests with documentation |

### Audit Trail

All backup and recovery operations must be logged with:

1. Operation type (backup, restore, verification)
2. Timestamp
3. User/process that initiated the operation
4. Affected data categories
5. Result status
6. Any errors or exceptions

## Roles and Responsibilities

| Role | Primary Responsibilities | Secondary Responsibilities |
|------|--------------------------|----------------------------|
| Database Administrator | Configure backup systems, Monitor backups, Troubleshoot issues | Perform recovery operations, Update procedures |
| Site Reliability Engineer | Review monitoring data, Perform recovery testing | Implement backup automation, Optimize backup performance |
| DevOps Engineer | Maintain backup infrastructure, Automate processes | Assist with recovery operations, Troubleshoot issues |
| Security Officer | Review access controls, Audit compliance | Validate encryption, Review procedures |
| Application Owner | Define RPO/RTO requirements, Validate recovery results | Prioritize recovery in incidents, Approve changes |

## Continuous Improvement

### Review Process

1. **Post-Incident Reviews**:
   - Conduct detailed review after any recovery incident
   - Document lessons learned and improvement opportunities
   - Update procedures based on findings

2. **Regular Reviews**:
   - Quarterly review of backup and recovery metrics
   - Assessment of actual vs. target RPO/RTO
   - Evaluation of new technologies and approaches

3. **Annual Strategy Review**:
   - Comprehensive review of entire strategy
   - Alignment with business requirements
   - Technology refresh assessment

### Documentation and Training

1. **Documentation Requirements**:
   - Maintain current recovery runbooks
   - Document all backup configurations
   - Keep historical records of recovery tests

2. **Training Program**:
   - Annual training for all team members
   - Quarterly hands-on recovery exercises
   - New team member onboarding procedures