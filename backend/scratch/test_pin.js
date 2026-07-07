const fetch = require('node-fetch');

async function test(pin) {
    try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await res.json();
        console.log(`PIN: ${pin}`);
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

test('534101'); // Example pin from previous logs
test('600001');
