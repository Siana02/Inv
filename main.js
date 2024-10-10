




document.getElementById('subscribeBtn').addEventListener('click', function() {
  const formContainer = document.getElementById('subscribeForm');
  formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
});



    document.getElementById('subscribeBtn').addEventListener('click', function() {
        document.getElementById('subscribeForm').style.display = 'block';
    });

    document.querySelector('.subscribe-form').addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent default form submission

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;

        fetch('/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`
        })
        .then(response => {
            if (response.ok) {
                alert('Subscription successful!');
                document.querySelector('.subscribe-form').reset(); // Clear the form
                document.getElementById('subscribeForm').style.display = 'none'; // Hide form
            } else {
                alert('Error subscribing. Please try again later.');
            }
        })
        .catch(err => {
            console.error(err);
            alert('Error subscribing. Please try again later.');
        });
    });

