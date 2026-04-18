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
        serial.write("\r\nir tx NEC 01 01\r\n");

    }
    if(controls.right){
        serial.write("\r\nir tx NEC 01 01\r\n");
    }
    if(controls.left){
        serial.write("\r\nir tx NEC 01 01\r\n");
    }




    serial.drain((v)=>{});

},150)














