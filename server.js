import express from 'express';
import {Gpio} from "onoff";
console.log(Gpio);
import "child_process";
import { spawn,execSync } from 'child_process';
const app = express();

app.use(express.json())




//serve public folder
app.use(express.static('public'));

//listen to port 3000
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});



const latestImage = {};

let controlsRaw = {
    forward: 0,
    turn: 0,
    timestamp: Date.now()

}

let controls = {
    forward: 0,
    turn: 0,
    timestamp: Date.now()

}
setInterval(()=>{
    controls.forward=lerp(controls.forward,controlsRaw.forward,0.12);
    controls.turn=lerp(controls.turn,controlsRaw.turn,1);
},50);


//get for image
app.get('/image', async (req, res) => {
    //let json = JSON.stringify({ image: latestImage});
    
    let proc = execSync("rpicam-jpeg -o - | base64 -w0")

    let json = JSON.stringify({image:image});
    
    res.status(200).send(json);

});


let forwardChangeTime = 0;
app.post('/controls', async (req, res) => {
    let data = req.body;

    if(controls.forward!=data.forward){
        forwardChangeTime=Date.now();
    }
    
    //update controls, checking validity of true or false
    controlsRaw.forward = parseFloat(data.forward);
    controlsRaw.turn = parseFloat(data.turn);

    controls.timestamp = Date.now();



    console.log(controls);
    updateGpio();
    res.status(200).send('Controls updated');
});

function lerp(a,b,f){
    if(Math.abs(a-b)<0.1){return b};
    return (a*(1-f))+(b*f);
}


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


class SoftPwm{
    constructor(period,callback){
        this.period = period;
        this.callback = callback;
        this.lowValue = 0;
        this.highValue = 0;
        this.duty = 0.35;
        this.state = false;
    
        this.update(callback);
    }
    update(callback){

            if(this.state && this.duty!=0 &&this.highValue!=this.lowValue){
            callback(this.highValue);
            setTimeout(()=>this.update(callback),this.period*this.duty);
        } else {
            callback(this.lowValue);
            setTimeout(()=>this.update(callback),this.period*(1-this.duty));
        }
        this.state = !this.state;

    }

}


let leftPwm = new SoftPwm(10, setLeft);
let rightPwm = new SoftPwm(10, setRight);

function setLeftPwm(speed){
    leftPwm.highValue=Math.sign(speed);
    leftPwm.duty=Math.abs(speed);
}
function setRightPwm(speed){
    rightPwm.highValue=Math.sign(speed);
    rightPwm.duty=Math.abs(speed);
}



function updateGpio(){

    if(Date.now() - controls.timestamp > 1200){
        setLeftPwm(0);    
        setRightPwm(0);
        controlsRaw.forward=0;
        controlsRaw.turn=0;
        return;
    }



    let leftSpeed = controls.forward;
    let rightSpeed = controls.forward;


    
    if(controls.forward==0||true){
        leftSpeed+=controls.turn;
        rightSpeed-=controls.turn;
    } else {
        if(controls.turn>0){
            rightSpeed = rightSpeed * (1-controls.turn);
        } else {
            leftSpeed = leftSpeed * (1-controls.turn);
        }
    }


    leftSpeed=Math.min(leftSpeed,1);
    leftSpeed=Math.max(leftSpeed,-1);

    rightSpeed=Math.min(rightSpeed,1);
    rightSpeed=Math.max(rightSpeed,-1);


    setLeftPwm(leftSpeed);
    setRightPwm(rightSpeed);



}


setInterval(()=>{
    updateGpio(); 



},100)










