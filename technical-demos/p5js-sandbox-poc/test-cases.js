/**
 * Test Cases for P5.js Sandbox Isolation
 * 
 * This file contains a collection of test cases to validate the security
 * and functionality of the P5.js sandbox isolation mechanism.
 */

const TEST_CASES = {
  // Safe test cases
  safe: {
    "simple-circle": {
      name: "Simple Circle",
      description: "A basic P5.js sketch that draws a circle",
      code: `
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  fill(255, 0, 0);
  ellipse(width/2, height/2, 100, 100);
}
      `
    },
    "moving-circle": {
      name: "Moving Circle",
      description: "A circle that moves around the canvas",
      code: `
let x = 0;
let speed = 3;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  fill(0, 0, 255);
  ellipse(x, height/2, 50, 50);
  
  x = x + speed;
  if (x > width || x < 0) {
    speed = -speed;
  }
}
      `
    },
    "interactive-sketch": {
      name: "Interactive Sketch",
      description: "A sketch that responds to mouse movements",
      code: `
function setup() {
  createCanvas(400, 400);
  colorMode(HSB, 100);
}

function draw() {
  background(220);
  
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      let x = i * 40 + 20;
      let y = j * 40 + 20;
      let d = dist(mouseX, mouseY, x, y);
      let hue = map(d, 0, 200, 0, 100);
      
      fill(hue, 80, 90);
      ellipse(x, y, 30, 30);
    }
  }
}
      `
    },
    "complex-animation": {
      name: "Complex Animation",
      description: "A more complex animation with multiple shapes",
      code: `
let particles = [];

function setup() {
  createCanvas(400, 400);
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      size: random(5, 20),
      speedX: random(-2, 2),
      speedY: random(-2, 2),
      color: color(random(255), random(255), random(255))
    });
  }
}

function draw() {
  background(0, 30);
  
  for (let p of particles) {
    fill(p.color);
    noStroke();
    ellipse(p.x, p.y, p.size, p.size);
    
    p.x += p.speedX;
    p.y += p.speedY;
    
    if (p.x < 0 || p.x > width) p.speedX *= -1;
    if (p.y < 0 || p.y > height) p.speedY *= -1;
  }
}
      `
    }
  },

  // Malicious test cases
  malicious: {
    "network-request": {
      name: "Network Request Attempt",
      description: "Attempts to make a network request (should be blocked)",
      code: `
function setup() {
  createCanvas(400, 400);
  
  // Attempt to make a fetch request
  fetch('https://example.com').then(response => {
    console.log('Response received:', response);
  }).catch(error => {
    console.error('Fetch failed:', error);
  });
  
  // Attempt to use XMLHttpRequest
  const xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://example.com');
  xhr.send();
}

function draw() {
  background(220);
  text('Attempted network requests', 100, 200);
}
      `
    },
    "storage-access": {
      name: "Storage Access Attempt",
      description: "Attempts to access browser storage (should be blocked)",
      code: `
let accessResults = {};

function setup() {
  createCanvas(400, 400);
  
  try {
    localStorage.setItem('test', 'value');
    accessResults.localStorage = 'Success - NOT SECURE!';
  } catch (e) {
    accessResults.localStorage = 'Blocked - Secure';
  }
  
  try {
    sessionStorage.setItem('test', 'value');
    accessResults.sessionStorage = 'Success - NOT SECURE!';
  } catch (e) {
    accessResults.sessionStorage = 'Blocked - Secure';
  }
  
  try {
    indexedDB.open('testDB');
    accessResults.indexedDB = 'Success - NOT SECURE!';
  } catch (e) {
    accessResults.indexedDB = 'Blocked - Secure';
  }
}

function draw() {
  background(220);
  textSize(16);
  
  let y = 50;
  for (let key in accessResults) {
    text(\`\${key}: \${accessResults[key]}\`, 50, y);
    y += 30;
  }
}
      `
    },
    "infinite-loop": {
      name: "Infinite Loop",
      description: "Contains an infinite loop (should be terminated)",
      code: `
function setup() {
  createCanvas(400, 400);
  
  // This will trigger the function call limit
  let counter = 0;
  while (true) {
    counter++;
    if (counter % 1000 === 0) {
      console.log('Still looping:', counter);
    }
  }
}

function draw() {
  background(220);
  text('You should not see this due to infinite loop', 50, 200);
}
      `
    },
    "memory-hog": {
      name: "Memory Hog",
      description: "Attempts to consume excessive memory (should be limited)",
      code: `
let bigArray = [];

function setup() {
  createCanvas(400, 400);
  
  // Try to allocate a lot of memory
  try {
    console.log('Attempting to allocate excessive memory...');
    for (let i = 0; i < 1000000; i++) {
      bigArray.push(new Array(1000).fill('memory hog'));
    }
    console.log('Memory allocation successful - NOT SECURE!');
  } catch (e) {
    console.error('Memory allocation failed:', e);
  }
}

function draw() {
  background(220);
  text('Attempted to allocate excessive memory', 50, 200);
  text(\`Current array length: \${bigArray.length}\`, 50, 250);
}
      `
    },
    "dom-manipulation": {
      name: "DOM Manipulation Attempt",
      description: "Attempts to manipulate the parent page DOM (should be blocked)",
      code: `
let manipulationResults = {};

function setup() {
  createCanvas(400, 400);
  
  try {
    // Try to access parent document
    document.body.innerHTML = '<h1>Hacked!</h1>';
    manipulationResults.documentBody = 'Success - NOT SECURE!';
  } catch (e) {
    manipulationResults.documentBody = 'Blocked - Secure';
  }
  
  try {
    // Try to create and insert an element
    const div = document.createElement('div');
    div.innerHTML = 'Injected content';
    document.body.appendChild(div);
    manipulationResults.createElement = 'Success - NOT SECURE!';
  } catch (e) {
    manipulationResults.createElement = 'Blocked - Secure';
  }
  
  try {
    // Try to access parent window
    window.parent.location = 'https://example.com';
    manipulationResults.parentLocation = 'Success - NOT SECURE!';
  } catch (e) {
    manipulationResults.parentLocation = 'Blocked - Secure';
  }
}

function draw() {
  background(220);
  textSize(16);
  
  let y = 50;
  for (let key in manipulationResults) {
    text(\`\${key}: \${manipulationResults[key]}\`, 50, y);
    y += 30;
  }
}
      `
    },
    "eval-execution": {
      name: "Eval Execution Attempt",
      description: "Attempts to use eval to execute code (may be blocked)",
      code: `
function setup() {
  createCanvas(400, 400);
  
  try {
    eval('alert("If you see this alert, eval is not blocked!")');
    console.log('Eval executed - Potentially NOT SECURE!');
  } catch (e) {
    console.error('Eval blocked:', e);
  }
  
  try {
    new Function('alert("If you see this alert, Function constructor is not blocked!")')();
    console.log('Function constructor executed - Potentially NOT SECURE!');
  } catch (e) {
    console.error('Function constructor blocked:', e);
  }
}

function draw() {
  background(220);
  text('Attempted to use eval and Function constructor', 50, 200);
}
      `
    },
    "syntax-error": {
      name: "Syntax Error",
      description: "Contains syntax errors to test error handling",
      code: `
function setup() {
  createCanvas(400, 400);
  
  // This line has a syntax error (missing closing parenthesis
  console.log('This will cause a syntax error';
}

function draw() {
  background(220);
  // This line also has an error (undefined variable)
  ellipse(undefinedVar, height/2, 50, 50);
}
      `
    },
    "escape-attempt": {
      name: "Sandbox Escape Attempt",
      description: "Attempts various techniques to escape the sandbox",
      code: `
let escapeResults = {};

function setup() {
  createCanvas(400, 400);
  
  // Attempt to overwrite built-in functions
  try {
    Function.prototype.call = () => console.log('Function.prototype.call overwritten');
    escapeResults.overwriteCall = 'Success - NOT SECURE!';
  } catch (e) {
    escapeResults.overwriteCall = 'Blocked - Secure';
  }
  
  // Attempt to access constructor
  try {
    const parentWindow = (function(){}).constructor('return window')();
    if (parentWindow !== window) {
      parentWindow.alert('Sandbox escaped!');
      escapeResults.constructorWindow = 'Success - NOT SECURE!';
    } else {
      escapeResults.constructorWindow = 'Blocked - Secure';
    }
  } catch (e) {
    escapeResults.constructorWindow = 'Blocked - Secure';
  }
  
  // Attempt to use iframe
  try {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const parentWindow = iframe.contentWindow.parent;
    if (parentWindow !== window) {
      escapeResults.iframeEscape = 'Success - NOT SECURE!';
    } else {
      escapeResults.iframeEscape = 'Blocked - Secure';
    }
  } catch (e) {
    escapeResults.iframeEscape = 'Blocked - Secure';
  }
  
  // Attempt to use Object.prototype.__proto__
  try {
    Object.prototype.__proto__ = null;
    escapeResults.protoManipulation = 'Success - NOT SECURE!';
  } catch (e) {
    escapeResults.protoManipulation = 'Blocked - Secure';
  }
}

function draw() {
  background(220);
  textSize(16);
  
  let y = 50;
  text('Sandbox Escape Attempts:', 50, y);
  y += 30;
  
  for (let key in escapeResults) {
    text(\`\${key}: \${escapeResults[key]}\`, 50, y);
    y += 30;
  }
}
      `
    }
  }
};