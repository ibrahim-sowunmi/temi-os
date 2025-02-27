const ngrok = require('ngrok');
const { spawn } = require('child_process');

// Start Next.js
const nextDev = spawn('npm', ['run', 'next-dev'], {
  stdio: 'inherit',
  shell: true
});

// Start ngrok
(async function() {
  try {
    console.log('Setting up ngrok...');
    const url = await ngrok.connect({
      addr: 3000, // Default Next.js port
      hostname: 'poodle-wired-goblin.ngrok-free.app', // Using hostname instead of domain for v5
      authtoken: '29Ipbi3EBV7vCVyWgrri5txOGDY_cUf5paHxyeHt3NLB2Mb5'
    });
    console.log('\n🚀 Ngrok tunnel created: ' + url);
    console.log('You can view your app at: ' + url + '\n');
  } catch (err) {
    console.error('Error starting ngrok:', err);
    process.exit(1);
  }
})();

// Handle process termination
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

function cleanup() {
  ngrok.kill();
  nextDev.kill();
  process.exit(0);
} 