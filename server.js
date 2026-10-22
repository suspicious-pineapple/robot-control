import express from 'express';
import proxy from "express-http-proxy";
import {Gpio} from "onoff";
console.log(Gpio);
import "child_process";
import { spawn,execSync } from 'child_process';
import {SerialPort} from "serialport";

const app = express();

//app.use(express.json())


let radarHistory = [];

//serve public folder
app.use(express.static('public'));

//listen to port 3000
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
app.use(express.json({ limit: '50mb' }));
app.use("/snapshot_0",proxy("http://localhost:8080/snapshot_0/snapshot_0",{
  parseReqBody: false,
}))

let latestImage = "";

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
    controls.turn=lerp(controls.turn,controlsRaw.turn,0.2);
},50);


//get for image
app.get('/image', async (req, res) => {
    //let json = JSON.stringify({ image: latestImage});
    
    let proc = execSync("rpicam-jpeg -o - | base64 -w0")
    let image = proc.stdout;
    let json = JSON.stringify({image:image});
    
    res.status(200).send(json);

});

            
async function decision(state,questions, image=null){
    let body = {
        state:state,
        questions: questions,
        images:[image],
        model: "LFM-D1-3b"
    };
    let res = await fetch("http://arclight:8080/v1/systemone", {
        method:"POST",
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    let json = await res.json();
    return json.answers;

}

let trackingPolicy = "Human";
let fetchNew = false;
let lastFetch = getImage();
async function trackingStep(){

    let questions = {
        "target_in_view":{
            type:"noul",
            instructions: "Is the target: "+trackingPolicy+" in view?"
        },
        /*
        "distance_to_wall":{
            type:"score",
            instructions:"How far is the rover from bumping into a wall?",
            criteria: ["Clear path ahead or wall only visible in the distance", "Wall within 1 meter", "Camera directly facing against wall"]
        },
        */
        "target_dir":{
            type:"score",
            instructions:"Locate the target"+trackingPolicy+" in the image. Is the target left, center, or right?",
            criteria: ["target is: left", "target is: straight ahead", "target is: right"]
        },
        
    }
    //getImage().then(i=>latestImage=i);
    if(fetchNew){

        latestImage = await getImage();
    } else {
        latestImage = await lastFetch;
    }

    let answers = decision("You are part of an autonomous rover navigation system. Consider the image input.", questions,latestImage);
    if(fetchNew){
        lastFetch = getImage();
    }

    fetchNew=!fetchNew;
    answers = await answers;
    console.log(answers);
    if(answers.target_in_view.noul > 0.7){
        let dir = (answers.target_dir.score - 1);
        controlsRaw.turn = Math.sign(dir)*0.75;
        let mag = Math.abs(dir/2);
        controls.timestamp = Date.now() - ((1-mag)*1200);
    }



}

//setInterval(trackingStep,5000);



//get for image
async function getImage(){

    let response = await fetch("http://localhost:8080/snapshot_0");
    let blob = await response.blob();

    let arrayBuffer = await blob.arrayBuffer();
    let b64 = Buffer.from(arrayBuffer).toString("base64");
    let mime = blob.type; // "image/png"

    let dataUrl = `data:${mime};base64,${b64}`;
    return dataUrl;
}



app.get('/radar', async (req, res) => {
    //let json = JSON.stringify({ image: latestImage});
    
    let json = JSON.stringify({radar:radarHistory});
    
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
let rightBackward1 = new Gpio(26+512,"out"); //4
//let rightBackward2 = new Gpio(27+512,"out"); //17
let rightForward1 = new Gpio(16+512,"out"); //27
//let rightForward2 = new Gpio(22+512,"out"); //22
let leftBackward1 = new Gpio(5+512,"out"); //5
//let leftBackward2 = new Gpio(5+512,"out"); //6
let leftForward1 = new Gpio(6+512,"out"); //13
//let leftForward2 = new Gpio(6+512,"out"); //19



function setRight(dir){
    if(dir==-1){
        rightForward1.write(0);
        //rightForward2.write(0);
        rightBackward1.write(1);
        //rightBackward2.write(1);
    }
    if(dir==0){
        rightForward1.write(0);
        //rightForward2.write(0);
        rightBackward1.write(0);
        ///rightBackward2.write(0);
    }
    if(dir==1){
        rightForward1.write(1);
        //rightForward2.write(1);
        rightBackward1.write(0);
        //rightBackward2.write(0);
    }
}




function setLeft(dir){
    if(dir==-1){
        leftForward1.write(0);
        //leftForward2.write(0);
        leftBackward1.write(1);
        //leftBackward2.write(1);
    }
    if(dir==0){
        leftForward1.write(0);
        //leftForward2.write(0);
        leftBackward1.write(0);
        //leftBackward2.write(0);
    }
    if(dir==1){
        leftForward1.write(1);
        //leftForward2.write(1);
        leftBackward1.write(0);
        //leftBackward2.write(0);
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







const serial = new SerialPort({path: "/dev/serial0",baudRate:29600});


let targets = [];

let buffer = [];
let currentPacket = [];
let packetLength = 0;
serial.on('data', (chunk)=>{
    //console.log(chunk);
    for (let index = 0; index < chunk.length; index++) {
        const element = chunk[index];
        //console.log("byte:" + element.toString(16));
        buffer.push(element);
        if(packetLength>0){
        if(packetLength>currentPacket.length){
            currentPacket.push(element);
        } else {
            
            let checksumReceived = currentPacket.pop();
            let checksumCalc = currentPacket.reduce((prev,cur)=>{return prev+cur}) & 0xFF;
            let checksumMatch = (checksumCalc==checksumReceived);
            if(checksumMatch && currentPacket[0]==7){
                //console.log("packet received: "+currentPacket + " checksum match: "+checksumMatch);
                
                currentPacket.shift();
                if(currentPacket.length > 0){

                    radarHistory.push(JSON.parse(JSON.stringify(currentPacket)));
                    if(radarHistory.length > 250){
                        radarHistory.shift();
                    }
                }
            }
            currentPacket=[];
            packetLength=0;
            buffer==[];
        }
        }

        if(buffer.length > 5){
            if(buffer[buffer.length-5]==0xFF &&buffer[buffer.length-4]==0xEE &&buffer[buffer.length-3]==0xDD){
                let length = buffer[buffer.length-1];
                packetLength=length+1; //gotta include the checksum
                console.log("got packet header! data length:", length);
            }
        }
        
    }
})

setTimeout(()=>{
    sendCommand();
},6000);

function sendCommand(commandword, dataword){
    let cmdBuffer = new Uint8Array(11);
    cmdBuffer[0]=0xFF;
    cmdBuffer[1]=0xEE;
    cmdBuffer[2]=0xDD;
    cmdBuffer[3]=0x00;
    cmdBuffer[4]=0x02;
    cmdBuffer[5]=0x02;
    cmdBuffer[6]=0x03;
    cmdBuffer[7]=0x05;
    cmdBuffer[8]=0xDD;
    cmdBuffer[9]=0xEE;
    cmdBuffer[10]=0xFF;
    serial.write(cmdBuffer);
    serial.drain((v)=>{console.log("callback called! "+v)});
    console.log("mode set!");
}













latestImage = await getImage();

while(true){
    await trackingStep();
}




