// --- CONFIGURACIÓN DE LA ESCENA ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x010204);

// CÁMARA INICIAL: vista general de la grúa de torre reticulada
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 1000);
const defaultCameraPos = new THREE.Vector3(10.0, 6.0, 11.0);
const defaultControlsTarget = new THREE.Vector3(0, 3.0, 0);

camera.position.copy(defaultCameraPos);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 26;
controls.minDistance = 1.4;
controls.enablePan = true;
controls.target.copy(defaultControlsTarget);

const infoCard = document.getElementById('info-card');
const infoTitle = document.getElementById('info-title');
const infoText = document.getElementById('info-text');

const targetCameraPos = new THREE.Vector3().copy(defaultCameraPos);
const targetControlsTarget = new THREE.Vector3().copy(defaultControlsTarget);
let targetLightIntensity = 0;
let targetAmbientIntensity = 1.0;
let isTransitioning = false;

// --- ILUMINACIÓN ---
const ambientLight = new THREE.AmbientLight(0x0a1128, 1.0);
scene.add(ambientLight);

const backLight = new THREE.DirectionalLight(0x1e293b, 1.5);
backLight.position.set(-10, 8, -10);
scene.add(backLight);

const cyanLight = new THREE.PointLight(0x00f2fe, 3, 18);
cyanLight.position.set(2, 6, 2);
scene.add(cyanLight);

const selectionLight = new THREE.PointLight(0xffffff, 0, 8, 1.2);
scene.add(selectionLight);

// --- GRUPOS ---
const mechanicalGroup = new THREE.Group();
const currentGroup = new THREE.Group();
const fieldsGroup = new THREE.Group();
scene.add(mechanicalGroup, currentGroup, fieldsGroup);

// Materiales
const metalMaterial = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.8, transparent: true, opacity: 1.0 });
const activeCopperMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, wireframe: true, transparent: true, opacity: 1.0 });
const copperOrangeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2, transparent: true });
const rubberBeltMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9, transparent: true });
const fieldLineMat = new THREE.LineBasicMaterial({ color: 0x9d4edd, transparent: true, opacity: 0.8 });
const electronMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
const strutMaterial = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.7, transparent: true });
const woodMaterial = new THREE.MeshStandardMaterial({ color: 0xb9884f, roughness: 0.85, metalness: 0.05, transparent: true });

function beamBetween(p1, p2, r, material) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), material);
    mesh.position.copy(p1).lerp(p2, 0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return mesh;
}

function buildLatticeTower(height, half) {
    const g = new THREE.Group();
    const postR = 0.05;
    const posts = [[-half, -half], [half, -half], [half, half], [-half, half]];
    
    posts.forEach(([x, z]) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(postR, postR, height, 10), metalMaterial);
        post.position.set(x, height / 2, z);
        g.add(post);
    });
    
    const segs = Math.max(3, Math.round(height / 0.9));
    const segH = height / segs;
    
    for (let i = 0; i <= segs; i++) {
        const y = i * segH;
        for (let k = 0; k < 4; k++) {
            const a = posts[k], b = posts[(k + 1) % 4];
            g.add(beamBetween(new THREE.Vector3(a[0], y, a[1]), new THREE.Vector3(b[0], y, b[1]), 0.03, strutMaterial));
        }
        if (i < segs) {
            for (let k = 0; k < 4; k++) {
                const a = posts[k], b = posts[(k + 1) % 4];
                g.add(beamBetween(new THREE.Vector3(a[0], y, a[1]), new THREE.Vector3(b[0], y + segH, b[1]), 0.02, strutMaterial));
                g.add(beamBetween(new THREE.Vector3(b[0], y, b[1]), new THREE.Vector3(a[0], y + segH, a[1]), 0.02, strutMaterial));
            }
        }
    }
    return g;
}

// --- ESTRUCTURA ---
const grid = new THREE.GridHelper(40, 40, 0x00f2fe, 0x080b12);
mechanicalGroup.add(grid);

const outletGroup = new THREE.Group();
outletGroup.position.set(-4.2, 0.9, -2.2);
mechanicalGroup.add(outletGroup);

const outletBox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.2), metalMaterial);
outletGroup.add(outletBox);

const outletPlate = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.02), new THREE.MeshBasicMaterial({ color: 0x00f2fe, wireframe: true }));
outletPlate.position.z = 0.11;
outletGroup.add(outletPlate);

const towerHeight = 4.4;
const baseSlab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 2.4), metalMaterial);
baseSlab.position.y = 0.1;
mechanicalGroup.add(baseSlab);

for (const [x, z] of [[-1.05, -1.05], [1.05, -1.05], [1.05, 1.05], [-1.05, 1.05]]) {
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 10), copperOrangeMat);
    bolt.position.set(x, 0.2, z);
    mechanicalGroup.add(bolt);
}

const tower = buildLatticeTower(towerHeight, 0.55);
mechanicalGroup.add(tower);

const woodCap = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.3, 1.15), woodMaterial);
woodCap.position.y = towerHeight + 0.15;
mechanicalGroup.add(woodCap);

const JibGroup = new THREE.Group();
JibGroup.position.y = towerHeight + 0.32;
mechanicalGroup.add(JibGroup);

const armLen = 4.2;
const arm = new THREE.Mesh(new THREE.BoxGeometry(armLen, 0.3, 0.26), metalMaterial);
arm.position.set(armLen / 2 - 0.9, 0.46, 0);
JibGroup.add(arm);
const tipX = armLen - 0.9 - 0.1;

const counterArm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.26, 0.24), metalMaterial);
counterArm.position.set(-1.4, 0.46, 0);
JibGroup.add(counterArm);

const counterweight = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.5), metalMaterial);
counterweight.position.set(-1.9, 0.4, 0);
JibGroup.add(counterweight);

const aFrameGroup = new THREE.Group();
JibGroup.add(aFrameGroup);

const apexHeight = 1.4, apexHalfSpan = 1.1, apexDepth = 0.4;
aFrameGroup.add(beamBetween(new THREE.Vector3(-apexHalfSpan, 0, 0), new THREE.Vector3(0, apexHeight, 0), 0.05, strutMaterial));
aFrameGroup.add(beamBetween(new THREE.Vector3(apexHalfSpan, 0, 0), new THREE.Vector3(0, apexHeight, 0), 0.05, strutMaterial));

function createDetailedWindshieldMotor() {
    const motorGroup = new THREE.Group();
    const stator = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.35, 16), metalMaterial);
    stator.rotation.x = Math.PI / 2;
    motorGroup.add(stator);

    const gearBox = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.28), metalMaterial);
    gearBox.position.set(0.1, -0.12, 0);
    motorGroup.add(gearBox);

    const windingL = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 16), copperOrangeMat);
    windingL.rotation.x = Math.PI / 2;
    windingL.position.z = 0.18;
    motorGroup.add(windingL);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), metalMaterial);
    shaft.rotation.x = Math.PI / 2;
    motorGroup.add(shaft);

    return motorGroup;
}

const motorLiftGroup = createDetailedWindshieldMotor();
motorLiftGroup.position.set(0, 1.3, 0);
aFrameGroup.add(motorLiftGroup);

const liftPulley = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 24), copperOrangeMat);
liftPulley.rotation.x = Math.PI / 2;
liftPulley.position.set(0, 1.3, 0.18);
aFrameGroup.add(liftPulley);

const motorRotGroup = createDetailedWindshieldMotor();
motorRotGroup.position.set(-0.6, -0.4, 0);
motorRotGroup.rotation.z = Math.PI / 2;
JibGroup.add(motorRotGroup);

const drivePulley = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16), copperOrangeMat);
drivePulley.position.set(-0.6, -0.15, 0);
JibGroup.add(drivePulley);

const transmissionBelt = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.03, 0.06), rubberBeltMat);
transmissionBelt.position.set(-0.3, -0.15, 0);
JibGroup.add(transmissionBelt);

const magnetGroup = new THREE.Group();
magnetGroup.position.set(tipX, -1.0, 0);
JibGroup.add(magnetGroup);

const core = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 16), metalMaterial);
magnetGroup.add(core);

const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.4, 16), activeCopperMat);
magnetGroup.add(coil);

const steelCablePoints = [new THREE.Vector3(0, 1.3, 0), new THREE.Vector3(tipX, 0.46, 0), new THREE.Vector3(tipX, -1.0, 0)];
const steelCableCurve = new THREE.CatmullRomCurve3(steelCablePoints);
const steelCable = new THREE.Mesh(new THREE.TubeGeometry(steelCableCurve, 32, 0.015, 8, false), metalMaterial);
JibGroup.add(steelCable);

// --- SISTEMA DE ELECTRONES ---
const staticPathPoints = [
    new THREE.Vector3(-4.2, 0.9, -2.2),
    new THREE.Vector3(-2.5, 2.0, -1.2),
    new THREE.Vector3(-0.3, 4.0, -0.3),
    new THREE.Vector3(0, towerHeight + 0.32, 0)
];
const staticPath = new THREE.CatmullRomCurve3(staticPathPoints);
const staticCable = new THREE.Mesh(new THREE.TubeGeometry(staticPath, 64, 0.03, 8, false), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.1, metalness: 0.9 }));
currentGroup.add(staticCable);

const localJibPathPoints = [
    new THREE.Vector3(0, -0.1, 0),
    new THREE.Vector3(0, 0.6, 0),
    new THREE.Vector3(tipX * 0.7, 0.35, 0),
    new THREE.Vector3(tipX, -1.0, 0)
];
const localJibPath = new THREE.CatmullRomCurve3(localJibPathPoints);
const localJibCable = new THREE.Mesh(new THREE.TubeGeometry(localJibPath, 64, 0.02, 8, false), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.1, metalness: 0.9 }));
JibGroup.add(localJibCable);

const numStaticElectrons = 18;
const staticElectrons = [];
const eGeo = new THREE.SphereGeometry(0.04, 8, 8);
for (let i = 0; i < numStaticElectrons; i++) {
    const el = new THREE.Mesh(eGeo, electronMat);
    currentGroup.add(el);
    staticElectrons.push({ mesh: el, progress: i / numStaticElectrons });
}

const numJibElectrons = 18;
const jibElectrons = [];
for (let i = 0; i < numJibElectrons; i++) {
    const el = new THREE.Mesh(eGeo, electronMat);
    JibGroup.add(el);
    jibElectrons.push({ mesh: el, progress: i / numJibElectrons });
}

// --- VECTORES Y ONDAS ---
const physicsVisualsGroup = new THREE.Group();
scene.add(physicsVisualsGroup);

const ampereRingsGroup = new THREE.Group();
physicsVisualsGroup.add(ampereRingsGroup);

const numAmpereSets = 4;
const ampereSets = [];
for (let s = 0; s < numAmpereSets; s++) {
    const setGroup = new THREE.Group();
    const ringI = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.28, 30), new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide, transparent: true }));
    const ringO = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.45, 30), new THREE.MeshBasicMaterial({ color: 0x9d4edd, side: THREE.DoubleSide, transparent: true }));
    ringI.rotation.x = Math.PI / 2; ringO.rotation.x = Math.PI / 2;
    setGroup.add(ringI, ringO);
    setGroup.position.set(-0.15, 0.6 + (s * 0.9), 0);
    ampereRingsGroup.add(setGroup);
    ampereSets.push({ group: setGroup, inner: ringI, outer: ringO, startY: 0.6 + (s * 0.9) });
}

const faradayGroup = new THREE.Group();
physicsVisualsGroup.add(faradayGroup);
const eddyRing1 = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.13, 32), new THREE.MeshBasicMaterial({ color: 0xff0055, side: THREE.DoubleSide, transparent: true }));
const eddyRing2 = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.25, 32), new THREE.MeshBasicMaterial({ color: 0xff0055, side: THREE.DoubleSide, transparent: true }));
eddyRing1.rotation.x = Math.PI / 2; eddyRing2.rotation.x = Math.PI / 2;
faradayGroup.add(eddyRing1, eddyRing2);

const lorentzVectorsGroup = new THREE.Group();
physicsVisualsGroup.add(lorentzVectorsGroup);
const lorentzOrigin = new THREE.Vector3(-0.6, towerHeight + 0.32 - 0.4, 0.35);
const arrowB = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0).normalize(), lorentzOrigin, 0.6, 0x00f2fe, 0.15, 0.08);
const arrowF = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0).normalize(), lorentzOrigin, 0.6, 0xff00ff, 0.15, 0.08);
lorentzVectorsGroup.add(arrowB, arrowF);

const mechanicalVectorsGroup = new THREE.Group();
physicsVisualsGroup.add(mechanicalVectorsGroup);
const tensionOrigin = new THREE.Vector3(tipX, towerHeight + 0.32 - 1.0, 0);
const arrowTension = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0).normalize(), tensionOrigin, 0.7, 0xeab308, 0.15, 0.08);
mechanicalVectorsGroup.add(arrowTension);

const localMagnetFieldsGroup = new THREE.Group();
magnetGroup.add(localMagnetFieldsGroup);
const magnetShield = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(0.85, 16, 12)));
magnetShield.material = new THREE.LineBasicMaterial({ color: 0x9d4edd, transparent: true, opacity: 0.6 });
localMagnetFieldsGroup.add(magnetShield);

const dipoleGroup = new THREE.Group();
localMagnetFieldsGroup.add(dipoleGroup);
for (let r = 0; r < Math.PI * 2; r += Math.PI / 4) {
    const points = [];
    for (let t = 0; t <= Math.PI; t += 0.1) {
        points.push(new THREE.Vector3(0.8 * Math.sin(t) * Math.cos(r), 0.7 * Math.cos(t), 0.8 * Math.sin(t) * Math.sin(r)));
    }
    dipoleGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3(points).getPoints(30)), fieldLineMat));
}

// --- INTERACTIVIDAD (HOTSPOTS) ---
const clickTargets = [];
const activeHotspots = [];

function createHighTechHotspot(parentGroup, localPos, id, title, desc, colorHex) {
    const hotspotContainer = new THREE.Group();
    hotspotContainer.add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.9 })));
    
    const rH = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.015, 8, 32), new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.7 }));
    rH.rotation.x = Math.PI / 2;
    hotspotContainer.add(rH);
    
    hotspotContainer.position.copy(localPos);
    parentGroup.add(hotspotContainer);

    const collMesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), new THREE.MeshBasicMaterial({ visible: false, transparent: true, opacity: 0 }));
    collMesh.position.copy(localPos);
    parentGroup.add(collMesh);

    activeHotspots.push({ container: hotspotContainer, ringH: rH });
    collMesh.userData = { id, parent: parentGroup, hotspot: hotspotContainer, title, description: desc, colorCard: colorHex };
    clickTargets.push(collMesh);
}

createHighTechHotspot(localMagnetFieldsGroup, new THREE.Vector3(0, 0.6, 0), 'magneto', 'Ley de Faraday-Lenz', '<b>La Ley de Faraday-Lenz</b> establece:<br>$$\\mathcal{E} = -\\frac{d\\Phi_B}{dt}$$<br>Al suministrar corriente variable a la bobina, se produce un flujo magnético variable en el tiempo. Esto induce fuerzas electromotrices opositoras en el núcleo de hierro, generando corrientes de Foucault que magnetizan fuertemente la base de metal.', 0x9d4edd);
createHighTechHotspot(motorRotGroup, new THREE.Vector3(0, 0.45, 0), 'motorGiro', 'Fuerza de Lorentz (Giro)', '<b>La Fuerza de Lorentz</b> describe la acción del campo sobre la corriente del rotor:<br>$$\\mathbf{F} = I(\\mathbf{L} \\times \\mathbf{B})$$<br>El inducido del motor se coloca verticalmente. Al fluir corriente de forma perpendicular al campo magnético, se genera la fuerza tangencial de empuje. La banda transmite esta rotación multiplicando el torque para girar la pluma.', 0x00f2fe);
createHighTechHotspot(motorLiftGroup, new THREE.Vector3(0, 0.45, 0), 'motorElevacion', 'Trabajo, Torque y Tensión', '<b>Equilibrio de Torque y Leyes de Newton:</b><br>$$\\boldsymbol{\\tau} = \\mathbf{r} \\times \\mathbf{F} \\quad \\text{y} \\quad T - m\\cdot g = m\\cdot a$$<br>El motor horizontal convierte el torque rotacional en tensión mecánica (\\(T\\)) en el cable de acero. Al girar, enrolla el cable sobre la polea, venciendo la masa del electroimán para levantarlo o bajarlo.', 0xeab308);
createHighTechHotspot(currentGroup, new THREE.Vector3(-1.4, 3.0, -0.75), 'cableConexion', 'Ley de Ampère-Maxwell', '<b>La Ley de Ampère-Maxwell</b> describe cómo la corriente de conducción engendra campos magnéticos:<br>$$\\oint \\mathbf{B} \\cdot d\\mathbf{l} = \\mu_0 I + \\mu_0 \\varepsilon_0 \\frac{d\\Phi_E}{dt}$$<br>El cable transporta el flujo de electrones libres desde el tomacorriente de pared. Toda corriente eléctrica (\\(I\\)) genera un campo magnético rotacional (\\(\\mathbf{B}\\)) concéntrico a su paso.', 0x10b981);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let activeTarget = null;

function updateSelectionDynamics() {
    if (activeTarget) {
        isTransitioning = true;
        controls.enabled = false;
        const targetWorldPos = new THREE.Vector3();
        activeTarget.getWorldPosition(targetWorldPos);
        const direction = new THREE.Vector3(0.5, 0.25, 0.83).normalize();

        targetControlsTarget.copy(targetWorldPos);
        targetCameraPos.copy(targetWorldPos).add(direction.multiplyScalar(5.5));

        selectionLight.position.copy(targetWorldPos).add(new THREE.Vector3(0, 0.4, 0));
        selectionLight.color.setHex(activeTarget.userData.colorCard);
        targetLightIntensity = 18.0; targetAmbientIntensity = 0.4;
    } else {
        targetLightIntensity = 0; targetAmbientIntensity = 1.0;
        isTransitioning = false; controls.enabled = true;
    }
}

renderer.domElement.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickTargets);
    if (intersects.length > 0) {
        const hit = intersects[0].object;
        activeTarget = (activeTarget && activeTarget.userData.id === hit.userData.id) ? null : hit;
    } else {
        activeTarget = null;
    }
    updateSelectionDynamics();
    updateUI();
});

function updateUI() {
    if (activeTarget) {
        const hex = "#" + activeTarget.userData.colorCard.toString(16).padStart(6, '0');
        infoTitle.innerText = activeTarget.userData.title;
        infoText.innerHTML = activeTarget.userData.description;
        infoCard.style.border = `1.5px solid ${hex}`;
        infoCard.style.boxShadow = `-10px 0 35px ${hex}33`;
        infoCard.style.display = 'block';
        setTimeout(() => { infoCard.style.opacity = '1'; }, 10);
        if (window.MathJax) MathJax.typesetPromise([infoText]);
    } else {
        infoCard.style.opacity = '0';
        setTimeout(() => { infoCard.style.display = 'none'; }, 300);
    }
}

function applyHolographicOpacity(targetId) {
    if (!targetId) {
        setGroupMaterialProperties(mechanicalGroup, 1.0, false);
        setGroupMaterialProperties(currentGroup, 1.0, false);
        return;
    }
    setGroupMaterialProperties(mechanicalGroup, 0.12, true);
    setGroupMaterialProperties(currentGroup, 0.12, true);

    if (targetId === 'magneto') {
        setGroupMaterialProperties(magnetGroup, 1.0, false);
        steelCable.material.opacity = 1.0; steelCable.material.transparent = false;
    } else if (targetId === 'motorGiro') {
        setGroupMaterialProperties(motorRotGroup, 1.0, false);
        drivePulley.material.opacity = 1.0; drivePulley.material.transparent = false;
        transmissionBelt.material.opacity = 1.0; transmissionBelt.material.transparent = false;
    } else if (targetId === 'motorElevacion') {
        setGroupMaterialProperties(motorLiftGroup, 1.0, false);
        liftPulley.material.opacity = 1.0; liftPulley.material.transparent = false;
    } else if (targetId === 'cableConexion') {
        setGroupMaterialProperties(outletGroup, 1.0, false);
        staticCable.material.opacity = 1.0; staticCable.material.transparent = false;
        setGroupMaterialProperties(currentGroup, 1.0, false);
    }
}

function setGroupMaterialProperties(group, opacity, transparent) {
    group.traverse(child => {
        if (child.isMesh && child.material) {
            if (child.material === electronMat || child.material === activeCopperMat) return;
            child.material.transparent = transparent; child.material.opacity = opacity;
        }
    });
}

// --- ANIMATION LOOP ---
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    if (!activeTarget) { JibGroup.rotation.y = Math.sin(elapsed * 0.22) * 0.35; }

    activeHotspots.forEach(hotspot => {
        hotspot.ringH.rotation.z += 0.015;
        const pulse = 1.0 + Math.sin(elapsed * 3) * 0.15;
        hotspot.container.scale.set(pulse, pulse, pulse);
    });

    applyHolographicOpacity(activeTarget ? activeTarget.userData.id : null);

    if (activeTarget) {
        const id = activeTarget.userData.id;
        lorentzVectorsGroup.visible = (id === 'motorGiro');
        mechanicalVectorsGroup.visible = (id === 'motorElevacion');
        faradayGroup.visible = (id === 'magneto');
        ampereRingsGroup.visible = (id === 'cableConexion');
    } else {
        lorentzVectorsGroup.visible = false; mechanicalVectorsGroup.visible = false; faradayGroup.visible = false; ampereRingsGroup.visible = true;
    }

    if (ampereRingsGroup.visible) {
        ampereSets.forEach((set, idx) => {
            let currentY = set.startY - ((elapsed * 0.5) % 0.9);
            if (currentY < 0.3) currentY += 3.6;
            set.group.position.y = currentY;
            const waveScale = 0.8 + ((elapsed * 3 + idx) % 1.2) * 0.5;
            set.outer.scale.set(waveScale, waveScale, 1);
            set.outer.material.opacity = 1.0 - ((waveScale - 0.8) / 0.9);
        });
    }

    if (faradayGroup.visible) {
        const pos = new THREE.Vector3(); magnetGroup.getWorldPosition(pos);
        faradayGroup.position.copy(pos).y -= 0.35;
        const pulse1 = (elapsed * 2.0) % 3;
        eddyRing1.scale.set(pulse1, pulse1, 1); eddyRing1.material.opacity = 1.0 - (pulse1 / 3);
    }

    staticElectrons.forEach(e => {
        e.mesh.position.copy(staticPath.getPointAt((e.progress + elapsed * 0.12) % 1.0));
    });
    jibElectrons.forEach(e => {
        e.mesh.position.copy(localJibPath.getPointAt((e.progress + elapsed * 0.12) % 1.0));
    });

    dipoleGroup.rotation.y += 0.015;
    magnetShield.rotation.x += 0.003;

    if (isTransitioning) {
        camera.position.lerp(targetCameraPos, 0.07);
        controls.target.lerp(targetControlsTarget, 0.07);
        if (camera.position.distanceTo(targetCameraPos) < 0.008) isTransitioning = false;
    }

    selectionLight.intensity = THREE.MathUtils.lerp(selectionLight.intensity, targetLightIntensity, 0.1);
    ambientLight.intensity = THREE.MathUtils.lerp(ambientLight.intensity, targetAmbientIntensity, 0.1);

    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});