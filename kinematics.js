
let default_L4 = 100; //lengths mm
let default_L1 = 40;



function get_angles(y,x,solution=-1,L4=default_L4,L1=default_L1){ //inverse kinematics -> get motor angles for a given point XY

let hyp = Math.hypot(x,y); //imaginary line from point XY to origin
let cos_alpha = ((hyp*hyp)+(L1*L1)-(L4*L4)) / (2*hyp*L1); //cosine of angle between that line and segment L1
let angle_m1 = Math.atan2(x,y) + solution*Math.acos(cos_alpha); //offset angle so that it is relative to the ground plane
let cos_beta = (-(hyp*hyp)+(L1*L1)+L4*L4)/(2*L4*L1); // cosine of the angle between segments L4 and L1
let angle_m2 = Math.acos(cos_beta)+(solution*angle_m1)-Math.PI; //convert to angle and rotate so that relative to ground plane
console.log(angle_m1*(180/Math.PI),angle_m2*(180/Math.PI)); // output angles to console, convert from rad to °deg

return [angle_m1,angle_m2]
}

const{hypot:h,atan2:t,acos:a,PI:p}=Math;
const f=(y,x,s,L,l)=>{let g=h(x,y),c=t(x,y)+s*a((g*g+l*l-L*L)/(2*g*l));return[c,a((-g*g+l*l+L*L)/(2*L*l))+s*c-p]}

function forward(m1,m2,L4=default_L4,L1=default_L1){ //forward kinematics -> go from known motor angles to point XY

    let x = (Math.cos(m1)*L1)+(Math.cos(m2)*L4);
    let y = (Math.sin(m1)*L1)+(Math.sin(m2)*L4);
    return {x,y}

}


let targetX = Math.random()*100;
let targetY = Math.random()*100;

let predicted = f(targetX,targetY,1,default_L4,default_L1);
let predicted2 = f(targetX,targetY,-1,default_L4,default_L1);
predicted = {angle_m1:predicted[0],angle_m2:predicted[1]};
predicted2 = {angle_m1:predicted2[0],angle_m22:predicted[1]};
console.log("target: ",targetX,targetY)
let check = forward(predicted.angle_m1,predicted.angle_m2);
let check2 = forward(predicted.angle_m1,predicted.angle_m2);
console.log(check,check2)




