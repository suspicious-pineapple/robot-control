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


let forwardChangeTime = 0;
app.post('/controls', async (req, res) => {
    let data = req.body;

    if(controls.forward!=data.forward){
        forwardChangeTime=Date.now();
    }
    
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



let pwmPeriod = 20;
let leftRatio = 0;
let rightRatio = 0;

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


let leftPwm = new SoftPwm(20, setLeft);
let rightPwm = new SoftPwm(20, setRight);

function setLeftPwm(val,duty=1){
    leftPwm.highValue=val;
    leftPwm.duty=duty;
}
function setRightPwm(val,duty=1){
    rightPwm.highValue=val;
    rightPwm.duty=duty;
}



function updateGpio(){

    if(Date.now() - controls.timestamp > 300){
        setLeftPwm(0);    
        setRightPwm(0);    
        return;
    }




    if(controls.backward){
        setLeftPwm(-1,0.35);    
        setRightPwm(-1,0.35);    
    }
    else if(controls.forward){
        

        setLeftPwm(1,0.45);    
        setRightPwm(1,0.45);    
    }
    else if(controls.right){
        setRightPwm(-1,0.7);    
        setLeftPwm(1,0.7);

    }
    else if(controls.left){
        setRightPwm(1,0.7);    
        setLeftPwm(-1,0.7);
    } else {
        setRightPwm(0);    
        setLeftPwm(0);    

    }


}


setInterval(()=>{
    updateGpio(); 



},300)















