# Mallrats

They're not there to shop. They're not there to work. They're just there. 

## Building

You will need npm with typescript and rollup installed globally. Then you can run:

    npm start
    
Then you can point your browser to:

    http://localhost:8080/

## Testing

Run a server:

    websocat -s 3232
    
Send some JSON:

    { "user": "samblake", "link": "shop", "referrer": "home" }
