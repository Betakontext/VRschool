AFRAME.registerComponent('football-model', {
  init: function () {
    const THREE = AFRAME.THREE;
    const group = new THREE.Group();
    const radius = 0.32;

    const whiteMaterial = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.8
    });

    const blackMaterial = new THREE.MeshStandardMaterial({
      color: '#151515',
      roughness: 0.9,
      side: THREE.DoubleSide
    });

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 48, 32),
      whiteMaterial
    );
    group.add(sphere);

    // Die zwölf Ecken eines Ikosaeders bestimmen die schwarzen Felder.
    const phi = (1 + Math.sqrt(5)) / 2;
    const directions = [
      [0, 1, phi], [0, -1, phi],
      [0, 1, -phi], [0, -1, -phi],
      [1, phi, 0], [-1, phi, 0],
      [1, -phi, 0], [-1, -phi, 0],
      [phi, 0, 1], [phi, 0, -1],
      [-phi, 0, 1], [-phi, 0, -1]
    ];

    directions.forEach(function (coordinates) {
      const normal = new THREE.Vector3(...coordinates).normalize();
      const reference = Math.abs(normal.y) > 0.9
        ? new THREE.Vector3(1, 0, 0)
        : new THREE.Vector3(0, 1, 0);

      const tangent = new THREE.Vector3()
        .crossVectors(reference, normal).normalize();
      const bitangent = new THREE.Vector3()
        .crossVectors(normal, tangent).normalize();

      const positions = [];
      const patchRadius = 0.105;
      const surfaceRadius = radius + 0.0015;

      function surfacePoint(x, y) {
        return normal.clone().multiplyScalar(radius)
          .addScaledVector(tangent, x)
          .addScaledVector(bitangent, y)
          .normalize()
          .multiplyScalar(surfaceRadius);
      }

      function triangle(a, b, c, depth) {
        if (depth === 0) {
          [a, b, c].forEach(function (point) {
            const projected = point.clone()
              .normalize().multiplyScalar(surfaceRadius);
            positions.push(projected.x, projected.y, projected.z);
          });
          return;
        }

        const ab = a.clone().add(b).multiplyScalar(0.5);
        const bc = b.clone().add(c).multiplyScalar(0.5);
        const ca = c.clone().add(a).multiplyScalar(0.5);

        triangle(a, ab, ca, depth - 1);
        triangle(ab, b, bc, depth - 1);
        triangle(ca, bc, c, depth - 1);
        triangle(ab, bc, ca, depth - 1);
      }

      const center = surfacePoint(0, 0);

      for (let i = 0; i < 5; i++) {
        const angleA = i * Math.PI * 2 / 5;
        const angleB = (i + 1) * Math.PI * 2 / 5;

        triangle(
          center,
          surfacePoint(
            Math.cos(angleA) * patchRadius,
            Math.sin(angleA) * patchRadius
          ),
          surfacePoint(
            Math.cos(angleB) * patchRadius,
            Math.sin(angleB) * patchRadius
          ),
          3
        );
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
      );
      geometry.computeVertexNormals();

      group.add(new THREE.Mesh(geometry, blackMaterial));
    });

    this.el.setObject3D('football', group);
  },

  remove: function () {
    const object = this.el.getObject3D('football');
    if (!object) return;

    const materials = new Set();

    object.traverse(function (child) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) materials.add(child.material);
    });

    materials.forEach(function (material) {
      material.dispose();
    });

    this.el.removeObject3D('football');
  }
});

