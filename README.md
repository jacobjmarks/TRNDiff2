# TRNDiff2
An overhaul of the [TRNDiff Regulon Explorer](http://trndiff.org/).

## Quick Start
The application is built using [NodeJS](https://nodejs.org/en/) [Express](https://expressjs.com/) and can be run in the usual way:

`npm install && npm start`

## Docker
A Docker image is available at `jacobjmarks/trndiff2`, and can be run with a standard port binding as follows:

`docker run --rm -it -p {HOST}:3000 jacobjmarks/trndiff2`

The Dockerfile for which can be seen in the repository.

## File Structure
The application follows a standard Express architecture. Each section is explained briefly below:

**`/db`** Database store and utilities.

**`/libs`** Server-side libraries wrapping computational functions.

**`/public`** Client-side javascripts, etc.

**`/routes`** HTTP server route definitions.

**`/views`** PUG templated HTML views, rendered on the server and served to the client.

**`app.js`** Application entrypoint.
