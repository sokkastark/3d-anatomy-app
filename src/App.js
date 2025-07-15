import React, { useRef, Suspense, useState, useEffect } from 'react'; // <--- Ensure useEffect is here
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three'; // Import THREE for potential material manipulation
// Remove this import; use PUBLIC_URL or direct src attribute for public images

import './App.css';

// --- Data for our example clickable parts in the 3D model ---
// YOU WILL NEED TO MATCH THESE 'meshName' IDs TO YOUR MODEL'S ACTUAL MESH NAMES
// Use console.log("Clicked object (mesh name):", event.object.name); in HumanModel to find them
const CLICKABLE_3D_PARTS = [
  // IMPORTANT: Replace 'YourModel_Head_Mesh_Name', etc., with the actual mesh names from your 'human.glb' model
  // If your model is a single mesh, all clicks will report the same meshName.
  // In that case, you can only highlight the whole body, or you'd need a more segmented model.
  { id: 'head', name: 'Head', meshName: 'YourModel_Head_Mesh_Name', positionOffset: [0, 0.5, 0] },
  { id: 'torso', name: 'Torso', meshName: 'YourModel_Torso_Mesh_Name', positionOffset: [0, -0.5, 0] },
  { id: 'arm', name: 'Arm', meshName: 'YourModel_Arm_Mesh_Name', positionOffset: [0.5, 0, 0] },
  { id: 'leg', name: 'Leg', meshName: 'YourModel_Leg_Mesh_Name', positionOffset: [0, -1.5, 0] },
  { id: 'brain', name: 'Brain', meshName: 'Allen_brain', positionOffset: [0, 0.5, 0] },
  { id: 'heart_3d', name: 'Heart', meshName: 'VH_M_heart', positionOffset: [0.1, -0.2, 0] },
  { id: 'lungs_3d', name: 'Lungs', meshName: 'YourModel_Lungs_Mesh_Name', positionOffset: [-0.1, -0.2, 0] },
  { id: 'stomach_3d', name: 'Stomach', meshName: 'YourModel_Stomach_Mesh_Name', positionOffset: [0.2, -0.5, 0] },
  { id: 'kidney_3d', name: 'Kidney', meshName: 'YourModel_Kidney_Mesh_Name', positionOffset: [0.2, -0.6, 0] },

];

// Data for clickable body parts (organs) and their related hover images and positions (adapted for 3D context)
// NOTE: 'details' property is removed here as information comes from DISEASE_DATA now
const BODY_PARTS_DATA_FOR_3D = [ // Renamed to avoid conflict and clarify purpose
  {
    id: 'head', name: 'Head',
    organImage: process.env.PUBLIC_URL + '/organ_brain.svg', // Icon for info panel
    hoverHighlightImage: process.env.PUBLIC_URL + '/organ_brain.svg', // Icon for 3D hover
    hoverImageSize: { width: '40px', height: '40px' },
  },
  {
    id: 'lungs', name: 'Lungs',
    organImage: process.env.PUBLIC_URL + '/organ_lungs.svg',
    hoverHighlightImage: process.env.PUBLIC_URL + '/organ_lungs.svg',
    hoverImageSize: { width: '90px', height: '80px' },
  },
  {
    id: 'heart_3d', name: 'Heart', // Use heart_3d to match CLICKABLE_3D_PARTS if your mesh is named 'heart_3d'
    organImage: process.env.PUBLIC_URL + '/organ_heart.svg',
    hoverHighlightImage: process.env.PUBLIC_URL + '/organ_heart.svg',
    hoverImageSize: { width: '70px', height: '70px' },
  },
  {
    id: 'stomach_3d', name: 'Stomach', // Use stomach_3d to match CLICKABLE_3D_PARTS
    organImage: process.env.PUBLIC_URL + '/organ_stomach.svg',
    hoverHighlightImage: process.env.PUBLIC_URL + '/organ_stomach.svg',
    hoverImageSize: { width: '80px', height: '70px' },
  },
  {
    id: 'kidney_3d', name: 'Kidney', // Use kidney_3d to match CLICKABLE_3D_PARTS
    organImage: process.env.PUBLIC_URL + '/organ_kidney.svg',
    hoverHighlightImage: process.env.PUBLIC_URL + '/organ_kidney.svg',
    hoverImageSize: { width: '70px', height: '70px' },
  },
  // You can add more general parts here if you want their organImage in the info panel
  { id: 'arm', name: 'Arm', organImage: null, hoverHighlightImage: null, hoverImageSize: null },
  { id: 'leg', name: 'Leg', organImage: null, hoverHighlightImage: null, hoverImageSize: null },
  { id: 'torso', name: 'Torso', organImage: null, hoverHighlightImage: null, hoverImageSize: null },
];


// NEW: Define your disease data, linking to 3D part IDs
const DISEASE_DATA = [
  {
    id: 'migraine', name: 'Migraine', related3DPartId: 'head',
    description: 'Migraine is a type of headache that can cause severe throbbing pain or a pulsing sensation, usually on one side of the head.',
    symptoms: ['Pulsating headache', 'Nausea', 'Vomiting', 'Sensitivity to light and sound'],
    treatments: ['Pain relievers', 'Triptans', 'Anti-nausea medications', 'Rest in a dark, quiet room'],
    whenToConsult: 'If headaches are new, unusually severe, or accompanied by neurological symptoms like weakness, numbness, or vision changes.'
  },
  {
    id: 'asthma', name: 'Asthma', related3DPartId: 'lungs_3d',
    description: 'Asthma is a chronic respiratory condition characterized by inflammation and narrowing of the airways, leading to difficulty breathing.',
    symptoms: ['Wheezing', 'Shortness of breath', 'Coughing (especially at night or early morning)', 'Chest tightness'],
    treatments: ['Inhalers (reliever and preventer)', 'Oral corticosteroids', 'Bronchodilators'],
    whenToConsult: 'If symptoms worsen, if inhalers are needed more frequently, or if experiencing severe breathing difficulties.'
  },
  {
    id: 'heart_attack', name: 'Heart Attack', related3DPartId: 'heart_3d',
    description: 'A heart attack occurs when blood flow to a part of the heart is blocked, usually by a blood clot.',
    symptoms: ['Chest pain (pressure, tightness, squeezing)', 'Shortness of breath', 'Pain radiating to arm (left)', 'Back pain', 'Nausea', 'Fatigue'],
    treatments: ['Emergency medical care (aspirin, nitroglycerin, angioplasty, bypass surgery)'],
    whenToConsult: 'IMMEDIATE EMERGENCY MEDICAL ATTENTION (call local emergency number) if experiencing symptoms.'
  },
  {
    id: 'gastritis', name: 'Gastritis', related3DPartId: 'stomach_3d',
    description: 'Gastritis is an inflammation of the lining of the stomach, often caused by infection, stress, or certain medications.',
    symptoms: ['Abdominal pain (burning or gnawing)', 'Nausea', 'Vomiting', 'Feeling of fullness after eating'],
    treatments: ['Antacids', 'Proton pump inhibitors (PPIs)', 'Antibiotics (if bacterial infection)'],
    whenToConsult: 'If symptoms persist, are severe, or accompanied by blood in vomit/stool.'
  },
  {
    id: 'kidney_stones', name: 'Kidney Stones', related3DPartId: 'kidney_3d',
    description: 'Kidney stones are hard deposits made of minerals and salts that form inside your kidneys.',
    symptoms: ['Severe pain in the side and back (below the ribs)', 'Pain that radiates to lower abdomen and groin', 'Painful urination', 'Nausea', 'Vomiting', 'Blood in urine'],
    treatments: ['Increased fluid intake', 'Pain relievers', 'Medical procedures for removal (lithotriza, surgery)'],
    whenToConsult: 'If experiencing severe pain, fever, chills, or difficulty urinating.'
  },
  // Add more diseases as needed, linking to appropriate related3DPartId
];


// Component to load and display the 3D model and handle clicks
function HumanModel({ onPartClick, active3DPartId }) {
  // useGLTF loads the GLTF/GLB model. 'nodes' object contains named meshes, 'scene' is the root object.
  const { scene, nodes } = useGLTF(process.env.PUBLIC_URL + '/human.glb');
  const originalMaterials = useRef({}); // Use ref to store original materials

  // --- DEBUGGING LOGS (Run once on component mount) ---
  useEffect(() => {
    console.log("--- 3D Model Loading & Structure Debug ---");
    console.log("Loaded 'nodes' object (contains named meshes):", nodes);
    console.log("Full 'scene' structure (traverse through it to find meshes):");
    let meshCount = 0;
    scene.traverse((child) => {
      console.log(`  - ${child.name} (isMesh: ${child.isMesh}, type: ${child.type})`);
      if (child.isMesh) {
        meshCount++;
      }
    });
    console.log(`--- Found ${meshCount} meshes in the model. ---`);
    console.log("------------------------------------------");
  }, [nodes, scene]); // Dependencies ensure this runs when model data is ready

  // Adjust model scale and position (TWEAK THESE IF YOUR MODEL IS TOO BIG/SMALL/OFF-CENTER)
  scene.scale.set(1, 1, 1); // Adjust scale (e.g., 0.1 for smaller, 10 for larger)
  scene.position.set(0, -1, 0); // Adjust position (e.g., move down by 1 unit)

  // Function to handle click on any part of the model
  const handleClick = (event) => {
    // --- DEBUGGING LOG (This will ONLY appear if the click handler is triggered) ---
    console.log("!!! handleClick CALLED !!!");
    console.log("Event object:", event);
    if (event.object) {
      console.log("Clicked 3D object:", event.object);
      console.log("Clicked object (mesh name):", event.object.name); // This is the key piece of info we need
    } else {
      console.log("Clicked event, but no specific object. (Perhaps background click?)");
    }
    // --- END DEBUGGING LOG ---

    event.stopPropagation(); // Stop orbit controls from interfering with click (IMPORTANT for R3F clicks)

    // Ensure event.object and its name exist before trying to find part
    if (event.object && event.object.name) {
      const clickedPart = CLICKABLE_3D_PARTS.find(
        (part) => part.meshName === event.object.name
      );
      onPartClick(clickedPart ? clickedPart.id : null, clickedPart ? event.point : null); 
    } else {
      // If no specific object was clicked (e.g., background), deselect
      onPartClick(null, null); 
    }
  };

  // Traverse the scene and attach click handlers to all meshes
  scene.traverse((child) => {
    if (child.isMesh) {
      // Store original material (only once) for highlighting
      if (!originalMaterials.current[child.uuid]) {
        originalMaterials.current[child.uuid] = child.material;
      }

      // --- ATTACHING CLICK HANDLER ---
      // R3F attaches listeners directly to the mesh.
      // The click will only register on the actual mesh geometry.
      child.onClick = handleClick; 
      // --- END ATTACHING ---

      // Apply/remove highlight
      const partIsActive = active3DPartId && CLICKABLE_3D_PARTS.some(
        p => p.id === active3DPartId && p.meshName === child.name
      );

      if (partIsActive) {
        if (!child.userData.highlightMaterial) {
          child.userData.highlightMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color('cyan'),
            emissive: new THREE.Color('cyan'),
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.8,
            depthWrite: true
          });
        }
        child.material = child.userData.highlightMaterial;
      } else {
        child.material = originalMaterials.current[child.uuid];
      }
    }
  });

  return <primitive object={scene} />;
}

// --- Main App Component ---
function App() {
  // State for the currently clicked 3D part (for 3D highlight & name tag)
  const [active3DPartId, setActive3DPartId] = useState(null);
  const [activeClickPoint, setActiveClickPoint] = useState(null); // World coordinates of the click

  // NEW STATE: State for the currently selected disease (for info panel)
  const [activeDiseaseId, setActiveDiseaseId] = useState(null);

  // This function is passed to HumanModel to receive click events
  const handle3DPartClick = (partId, clickPoint) => {
    // If clicking the same part, deselect it
    if (active3DPartId === partId) {
      setActive3DPartId(null);
      setActiveClickPoint(null);
      setActiveDiseaseId(null); // Also deselect disease
    } else {
      setActive3DPartId(partId);
      setActiveClickPoint(clickPoint);
      // Find a related disease for this 3D part (if any) and set it as active
      const relatedDisease = DISEASE_DATA.find(d => d.related3DPartId === partId);
      setActiveDiseaseId(relatedDisease ? relatedDisease.id : null);
    }
  };

  /*// --- Handlers for Left Panel List Clicks ---
  const handleDiseaseListClick = (diseaseId) => {
    const selectedDisease = DISEASE_DATA.find(d => d.id === diseaseId);
    if (selectedDisease) {
      setActiveDiseaseId(diseaseId); // Set the active disease
      // Also set the related 3D part as active to highlight it on the model
      setActive3DPartId(selectedDisease.related3DPartId);
      // Placeholder click point for name tag if activated from list (you can adjust)
      // Find the 3D part data to get its suggested tag position
      const corresponding3DPart = CLICKABLE_3D_PARTS.find(p => p.id === selectedDisease.related3DPartId);
      if (corresponding3DPart && corresponding3DPart.positionOffset) {
        // Use positionOffset from CLICKABLE_3D_PARTS for placing the tag
        // Convert array to Vector3, then add to model's base position (0,-1,0) if necessary
        // For now, let's simplify and just use a known point relative to the model's base for list clicks
        // You'll need to fine-tune this for accurate tag placement from list clicks
        // Example:
        const tagPos = new THREE.Vector3(corresponding3DPart.positionOffset[0], corresponding3DPart.positionOffset[1], corresponding3DPart.positionOffset[2]);
        tagPos.add(new THREE.Vector3(0, -1, 0)); // Adjust based on your model's scene.position
        setActiveClickPoint(tagPos);

      } else {
        setActiveClickPoint(null); // No name tag if no offset defined
      }
    }
  };*/

  // --- Clear All Selection ---
  const clearAllSelection = () => {
    setActive3DPartId(null);
    setActiveClickPoint(null);
    setActiveDiseaseId(null);
  };

  // --- Data Lookups ---
  const current3DPartData = CLICKABLE_3D_PARTS.find(
    (part) => part.id === active3DPartId
  );
  const currentDiseaseData = DISEASE_DATA.find(
    (disease) => disease.id === activeDiseaseId
  );
  // For showing organ image in info panel (pull from BODY_PARTS_DATA_FOR_3D)
  const currentOrganInfoForPanel = currentDiseaseData ? BODY_PARTS_DATA_FOR_3D.find(
    part => part.id === currentDiseaseData.related3DPartId
  ) : null;


  
  return (
    <div className="app-container"> {/* This is the main container that fills the screen */}
      {/* 3D Canvas (Background Layer) */}
      <Canvas camera={{ position: [0, 0, 8], fov: 60, near: 0.1, far: 200 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={1} />
        <pointLight position={[-10, -10, -10]} decay={0} intensity={1} />

        <Suspense fallback={null}>
          <HumanModel onPartClick={handle3DPartClick} active3DPartId={active3DPartId} />
        </Suspense>

        {/* Display the HTML name tag if a part is active */}
        {current3DPartData && activeClickPoint && (
          <Html
            position={activeClickPoint} // Position the HTML element at the 3D click point
            center // Center the HTML div around the position
            distanceFactor={10} // Makes it scale better with distance
            className="name-tag"
          >
            <div className="name-tag-content">
              {current3DPartData.name}
              <div className="name-tag-line"></div>
            </div>
          </Html>
        )}

        {
         <OrbitControls
          enableZoom
          enablePan
          target={[0, -0.5, 0]}
          minDistance={1}
          maxDistance={15}
         />
        }

      </Canvas>

      {/* Overlay Header */}
      <header className="app-header">
        <img src={process.env.PUBLIC_URL + '/guardian-logo color.png'} alt="Logo" className="logo" />
        <h1>The Patient’s Lens</h1>
        <p className="patient-details">Chiron, Stark | 08/22/1990 | 34 | M</p>
      </header>

      {/* Overlay Left Panel */}
      {/* <div className="left-panel">
        <h2>Diseases:</h2>
        <ul>
          {DISEASE_DATA.map((disease) => (
            <li
              key={disease.id}
              onClick={() => handleDiseaseListClick(disease.id)}
              className={activeDiseaseId === disease.id ? 'selected-item' : ''}
            >
              {disease.name}
            </li>
          ))}
          <li><button onClick={clearAllSelection} className="clear-button">Clear All</button></li>
        </ul>
      </div>
      */}

      {/* Overlay Right Panel */}
      <div className="right-panel">
        <h2>Info:</h2>
        {currentDiseaseData ? (
          <>
            <button className="close-btn" onClick={clearAllSelection}>X</button>
            <h3>{currentDiseaseData.name} Information</h3>

            {currentOrganInfoForPanel && currentOrganInfoForPanel.organImage && (
              <img src={currentOrganInfoForPanel.organImage} alt={`${currentOrganInfoForPanel.name} Organ`} className="organ-icon" />
            )}

            {currentDiseaseData.description && (
              <>
                <h4>Description:</h4>
                <p>{currentDiseaseData.description}</p>
              </>
            )}

            {currentDiseaseData.symptoms && currentDiseaseData.symptoms.length > 0 && (
              <>
                <h4>Symptoms:</h4>
                <ul>
                  {currentDiseaseData.symptoms.map((symptom, index) => (
                    <li key={index}>{symptom}</li>
                  ))}
                </ul>
              </>
            )}

            {currentDiseaseData.treatments && currentDiseaseData.treatments.length > 0 && (
              <>
                <h4>Treatments:</h4>
                <ul>
                  {currentDiseaseData.treatments.map((treatment, index) => (
                    <li key={index}>{treatment}</li>
                  ))}
                </ul>
              </>
            )}

            {currentDiseaseData.whenToConsult && (
              <>
                <h4>When to Consult:</h4>
                <p>{currentDiseaseData.whenToConsult}</p>
              </>
            )}

            <div className="action-buttons">
              <button>Consultation</button>
              <button>More Info</button>
            </div>
          </>
        ) : (
          <p>Click on a body part or select a disease from the list to learn more!</p>
        )}
      </div>
    </div>
  );
}

export default App;