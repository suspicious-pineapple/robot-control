import express from 'express';
import Gpio from "onoff";


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



let rightForward1 = new Gpio(4,"out");
let rightForward2 = new Gpio(17,"out");
let rightBackward1 = new Gpio(27,"out");
let rightBackward2 = new Gpio(22,"out");
let leftForward1 = new Gpio(5,"out");
let leftForward2 = new Gpio(6,"out");
let leftBackward1 = new Gpio(13,"out");
let leftBackward2 = new Gpio(19,"out");




function setRight(dir){
    if(dir==-1){
        rightForward1.writeSync(0);
        rightForward2.writeSync(0);
        rightBackward1.writeSync(1);
        rightBackward2.writeSync(1);
    }
    if(dir==0){
        rightForward1.writeSync(0);
        rightForward2.writeSync(0);
        rightBackward1.writeSync(0);
        rightBackward2.writeSync(0);
    }
    if(dir==1){
        rightForward1.writeSync(1);
        rightForward2.writeSync(1);
        rightBackward1.writeSync(0);
        rightBackward2.writeSync(0);
    }
}




function setLeft(dir){
    if(dir==-1){
        leftForward1.writeSync(0);
        leftForward2.writeSync(0);
        leftBackward1.writeSync(1);
        leftBackward2.writeSync(1);
    }
    if(dir==0){
        leftForward1.writeSync(0);
        leftForward2.writeSync(0);
        leftBackward1.writeSync(0);
        leftBackward2.writeSync(0);
    }
    if(dir==1){
        leftForward1.writeSync(1);
        leftForward2.writeSync(1);
        leftBackward1.writeSync(0);
        leftBackward2.writeSync(0);
    }
}




setInterval(()=>{
    
    if(Date.now() - controls.timestamp > 500){
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




},350)














