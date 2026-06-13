import express from 'express';
import {Gpio} from "onoff";
console.log(Gpio);

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
    updateGpio();
    res.status(200).send('Controls updated');
});



let rightBackward1 = new Gpio(17+512,"out"); //4
let rightBackward2 = new Gpio(27+512,"out"); //17
let rightForward1 = new Gpio(4+512,"out"); //27
let rightForward2 = new Gpio(22+512,"out"); //22
let leftBackward1 = new Gpio(19+512,"out"); //5 
let leftBackward2 = new Gpio(5+512,"out"); //6
let leftForward1 = new Gpio(13+512,"out"); //13
let leftForward2 = new Gpio(6+512,"out"); //19




function setRight(dir){
    if(dir==-1){
        rightForward1.write(0);
        rightForward2.write(0);
        rightBackward1.write(1);
        rightBackward2.write(1);
    }
    if(dir==0){
        rightForward1.write(0);
        rightForward2.write(0);
        rightBackward1.write(0);
        rightBackward2.write(0);
    }
    if(dir==1){
        rightForward1.write(1);
        rightForward2.write(1);
        rightBackward1.write(0);
        rightBackward2.write(0);
    }
}




function setLeft(dir){
    if(dir==-1){
        leftForward1.write(0);
        leftForward2.write(0);
        leftBackward1.write(1);
        leftBackward2.write(1);
    }
    if(dir==0){
        leftForward1.write(0);
        leftForward2.write(0);
        leftBackward1.write(0);
        leftBackward2.write(0);
    }
    if(dir==1){
        leftForward1.write(1);
        leftForward2.write(1);
        leftBackward1.write(0);
        leftBackward2.write(0);
    }
}



function updateGpio(){

    if(Date.now() - controls.timestamp > 300){
        setLeft(0);    
        setRight(0);    
        return;
    }




    if(controls.backward){
        setLeft(-1);    
        setRight(-1);    
    }
    if(controls.forward){
        
        setLeft(1);    
        setRight(1);    
    }
    if(controls.right){
        setRight(-1);    
        setLeft(1);    

    }
    if(controls.left){
        setRight(1);    
        setLeft(-1);
    }

}


setInterval(()=>{
    updateGpio(); 



},200)














