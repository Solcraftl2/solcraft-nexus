const url = process.env.HEALTH_URL || 'http://localhost:3000/dashboard';

async function run() {
  try {
    const res = await fetch(url);
    if (res.status === 200) {
      console.log(`Dashboard health check passed: ${res.status}`);
    } else {
      console.error(`Dashboard health check failed with status ${res.status}`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Dashboard health check error:', err);
    process.exit(1);
  }
}

run();
