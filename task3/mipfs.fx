#version 300 es
precision highp float;
precision highp sampler3D;

in vec3 uv;
uniform sampler3D u_texture;
uniform sampler2D u_lut;
uniform vec2 bw;
uniform vec3 eyePos;
out vec4 color;

#define NUM_SAMPLES 256

void main() {
    vec3 pos = uv;
    float step = 1.71 / float(NUM_SAMPLES);
    //vec3 o = .5 * (eyePos - 1.0);
    vec3 o = eyePos;
    vec3 dir = normalize(uv - o);

    float val = -32000.0;
    for(int i = 0; i < NUM_SAMPLES; i++) {
        val = max(val, texture(u_texture, pos).r);
        pos += dir * step;
        if(clamp(pos, 0.0, 1.0) != pos) break;
    }
    val = (val - bw.x) / (bw.y - bw.x);
    color = texture(u_lut, vec2(val, 0.5));
}