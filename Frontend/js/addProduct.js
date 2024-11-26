document.getElementById('addProductForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent default form submission

    // Get the values from the form
    const name = document.getElementById('name').value;
    const price = document.getElementById('price').value;
    const desc = document.getElementById('desc').value;
    const quant = document.getElementById('quant').value;

    // tenemos que determinar como vamos a guardar el jwt
    const token = localStorage.getItem('authToken');  // Adjust this if you're storing the token elsewhere

    console.log(token)
    // por el momento:
    //const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7Im5hbWUiOiJqYW5lIGRvZSIsInBhc3N3b3JkIjoiJDJiJDEwJEFmdkJZWFdLaVg2Qy5CUGZkdDVjVWVMa25CakZqa0ViOTM1Z2J6azV2UHMyMm9ZOGREeS8yIiwicm9sZSI6ImFkbWluIn0sImlhdCI6MTczMjU3OTMzNiwiZXhwIjoxNzMyNTgyOTM2fQ.4S--xs3eZFHQNyXgnyDUFneyXqgYDwX0HwEbo5bxpP0'
    // Prepare the request body
    const productData = {
        name: name,
        price: price,
        desc: desc,
        quant: quant
    };

    // Send the POST request to the server
    try {
        const response = await fetch('http://localhost:3000/addProduct', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`  // Attach the JWT token
            },
            body: JSON.stringify(productData)
        });

        // Handle the response
        const responseData = await response.text();
        console.log('response data:')
        console.log(responseData)

        if (response.ok) {
            document.getElementById('responseMessage').textContent = 'Product added successfully!';
        } else {
            document.getElementById('responseMessage').textContent = `Error: ${responseData}`;
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('responseMessage').textContent = 'An error occurred. Please try again.';
    }
});
