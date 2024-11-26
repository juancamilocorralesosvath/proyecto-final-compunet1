

        // Function to get JWT data and parse it (this requires a JWT decoding function)
        function decodeJWT(token) {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
    
            return JSON.parse(jsonPayload);
        }
    // Check if the user is logged in by checking for a JWT in localStorage
    const token = localStorage.getItem('authToken');
    const dynamicButtons = document.getElementById('dynamic-buttons');
    console.log('hello')

    if (token) {
        console.log(token)
        // If there's a token, decode it to check the user's role
        const decodedToken = decodeJWT(token);
        console.log(decodedToken)

        // Check if the user is an admin
        if (decodedToken.user && decodedToken.user.role === 'admin') {
            // If the user is an admin, add the "Add Product" button
            dynamicButtons.innerHTML = `
                <a href="addProduct.html" class="btn btn-outline-dark ms-2">Add Product</a>
                <a href="logout.html" class="btn btn-outline-dark ms-2">logout</a>
            `;
        } else {
            // If the user is logged in but not an admin, you can add other options here if needed
            dynamicButtons.innerHTML = `
                <span class="btn btn-outline-dark ms-2">Logged In</span>
                <a href="logout.html" class="btn btn-outline-dark ms-2">logout</a>
            `;
        }
    } else {
        // If no token is found, show the "Login" button
        dynamicButtons.innerHTML = `
            <a href="LogIn.html" class="btn btn-outline-dark ms-2">Login</a>
        `;
    }


