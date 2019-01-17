# Mallrats

They're not there to shop. They're not there to work. They're just there.

Realtime visualisation of user journeys.

![Mallrats Screenshot](https://i.ibb.co/5GRYm81/mallrats.png)

## Requirements

You will need npm, tsc and rollup installed globally. To run the Docker environment you will also need Docker Compose.

## Building

First run:

    npm start
    
You can then point your browser to:

    http://localhost:8080/

## Command Line Testing 

Install [websocat](https://github.com/vi/websocat) and run a server:

    websocat -s 3232
    
Send some JSON:

    { "user": "samblake", "link": "shop", "referrer": "home" }

## Docker

To run a full environment in Docker first build Mallrats:

    tsc
    rollup -c

Add a test site to ./example/site/ and start up Docker:

    cd example
    docker-compose up

You can then point your browser to:

    http://localhost/

Your journey will be reflected in Mallrats running on port 8080.
