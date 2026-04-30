export const CANVAS_W=360,CANVAS_H=580,WORLD_MIN_X=-180,WORLD_MAX_X=180,WORLD_MIN_Y=-290,WORLD_MAX_Y=290,MAX_INSTANCES=20000,INST_FLOATS=16;
export const SHAPE_BOX=0,SHAPE_ROUND_BOX=1,SHAPE_CIRCLE=2,SHAPE_CAPSULE=3,SHAPE_TRIANGLE=4,SHAPE_RING=5,SHAPE_GLOW=6;
export const PAL={
 skyTop:[.14,.20,.28,1],skyBot:[.08,.06,.04,1],ground:[.12,.19,.12,1],road:[.20,.20,.20,1],roadLine:[.75,.72,.45,.78],shadow:[0,0,0,.28],target:[1,.82,.12,1],ball:[1,.2,.1,1],ballHi:[1,.75,.55,1],flipper:[1,.82,.12,1],human:[1,.82,.52,1],blood:[1,.18,.12,1],white:[1,1,1,1],dark:[.08,.08,.08,1],house:[.70,.50,.34,1],townhouse:[.72,.55,.40,1],garage:[.45,.45,.45,1],shop:[.42,.62,.82,1],ramen:[.84,.32,.22,1],convenience:[.30,.78,.55,1],apartment:[.48,.58,.70,1],station:[.88,.78,.48,1],hospital:[.88,.90,.94,1],tower:[.45,.70,.90,1]
};
export const BUILDING_W=new Float32Array([16,18,20,22,16,24,24,50,35,35]);
export const BUILDING_H=new Float32Array([20,24,14,25,20,22,40,36,50,70]);
export const BUILDING_HP=new Int8Array([1,1,1,1,1,1,2,3,3,3]);
export const BUILDING_SCORE=new Int32Array([100,120,80,180,160,350,600,2500,1800,2500]);
export const BUILDING_COLORS=[PAL.house,PAL.townhouse,PAL.garage,PAL.shop,PAL.ramen,PAL.convenience,PAL.apartment,PAL.station,PAL.hospital,PAL.tower];
