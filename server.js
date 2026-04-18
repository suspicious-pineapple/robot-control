import express from 'express';

import {SerialPort} from "serialport";

const app = express();

app.use(express.json())




//serve public folder
app.use(express.static('public'));

//listen to port 3000
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});



const latestImage = {};

let controls = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    timestamp: Date.now()

}



//get for image
app.get('/image', (req, res) => {
    let json = JSON.stringify({ image: latestImage});
    res.status(200).send(json);

});


app.post('/controls', async (req, res) => {
    let data = req.body;

    //update controls, checking validity of true or false
    controls.forward = data.forward === true;
    controls.backward = data.backward === true;
    controls.left = data.left === true;
    controls.right = data.right === true;
    controls.timestamp = Date.now();



    console.log(controls);

    res.status(200).send('Controls updated');
});



const serial = new SerialPort({path: "COM3",baudRate:11250});
serial.on('data', (chunk)=>{console.log(chunk.toString())});
setInterval(()=>{
    
    if(Date.now() - controls.timestamp > 1000){
        return;
    }

    if(controls.backward){
        serial.write("\r\nir tx NEC 01 01\r\n");
    }
    if(controls.forward){
        serial.write("\r\nir tx RAW F:38000 DC:33 2394 363 403 399 374 372 1161 1139 1159 1136 402 371 403 68639 2400 365 401 370 403 373 401 1138 1161 1135 1163 371 401 68745 2401 362 404 372 402 374 400 1139 1161 1136 1162 370 402 68758 2400 392 373 370 404 373 401 1141 1159 1139 1159 398 374 68844 2398 362 404 370 403 370 403 1138 1161 1136 1162 371 401 68650 2397 361 405 399 374 371 403 1139 1161 1136 1162 369 403\r\n");

    }
    if(controls.right){
        serial.write("\r\nir tx RAW F:38000 DC:33 2406 364 403 1139 403 373 401 1139 1163 1137 403 1137 405 68792 2402 363 403 1138 403 371 403 1140 1161 1138 401 1138 403 68692 2403 363 403 372 402 369 405 1138 1163 1139 1160 371 401 68784 2402 362 404 370 404 370 404 1138 1163 1136 1163 367 405 68859 2404 363 403 371 403 370 404 1137 1164 1137 1162 369 404 68683 2402 363 403 373 401 370 404 1137 1165 1136 1163 370 402 68784 2404 361 405 369 405 399 375 1139 1162 1135 1165 370 402\r\n");
    }
    if(controls.left){
        serial.write("\r\nir tx NEC 01 01\r\n");
    }




    serial.drain((v)=>{});

},350)














