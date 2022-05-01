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

    vec4 res_color = vec4(0.0);
    for(int i = 0; i < NUM_SAMPLES; i++) {
        float val = texture(u_texture, pos).r;
        val = (val - bw.x) / (bw.y - bw.x);
        float alpha = clamp(val, 0.0, 1.0);
        
        vec4 current_color = texture(u_lut, vec2(val, 0.5));
        res_color = vec4(res_color.rgb * res_color.a + current_color.rgb * (1.0 - res_color.a), clamp(res_color.a + alpha, 0.0, 1.0));
        pos += dir * step;
        if(clamp(pos, 0.0, 1.0) != pos) break;
    }
    color = res_color;
}