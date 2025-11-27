const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const camera = {
    x: 0,
    y: 0
};

const obstacles = [
    {
        x: 200,
        y: -100,
        width: 100,
        height: 80
    },
    {
        x: -250,
        y: 50,
        width: 120,
        height: 60
    }
];

const streetLight = {
    x: 150,
    y: 150,
    poleWidth: 8,
    poleHeight: 60
};

const interactiveObjects = [
    { type: 'mailbox', x: -100, y: -200, hit: false },
    { type: 'trashcan', shape: 'round', color: '#4a4a4a', x: 300, y: 100, hit: false },
    { type: 'trashcan', shape: 'square', color: '#2a5a2a', x: -200, y: 200, hit: false },
    { type: 'trashcan', shape: 'round', color: '#5a2a2a', x: 100, y: -150, hit: false },
    { type: 'trashcan', shape: 'square', color: '#2a2a5a', x: -300, y: -50, hit: false }
];

const debris = [];

const keys = {};
let lightsOn = false;
let headlightsOn = true;
let lKeyPressed = false;
let hKeyPressed = false;
let spotlightActive = false;
let mouseWorldX = 0;
let mouseWorldY = 0;
