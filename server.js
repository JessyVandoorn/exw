{
    const express = require('express');
    const app = express();
    const server = require('http').Server(app);
    const port = process.env.PORT || 8080;
    const io = require('socket.io')(server);

    server.listen(port, () => {
        console.log(`App listening on port ${port}!`);
    });

    app.use(`/`, express.static(`public`));

    io.on('connection', socket => {
        console.log('connection');
        socket.on(`message`, message => {
            console.log(`Received message: ${message}`);
            io.sockets.emit(`message`, message);
        })
    });

}