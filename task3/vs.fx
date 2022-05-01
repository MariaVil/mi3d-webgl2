#version 300 es

in vec3 a_position;
uniform mat4 worldViewProjection;
out vec3 uv;

void main() {
    uv = a_position;
    gl_Position = worldViewProjection * vec4(a_position, 1.0);
}