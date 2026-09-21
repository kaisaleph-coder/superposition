export const SURFACE_FAMILIES=[
  'bands','membrane','slices','shell','lattice','truss','filaments','braid','ribbons','contours','cells','orbits','streams','spines','shards','cloud','halo'
];

export const SURFACE_COST={
  bands:{cost:3,webgl:'full'},membrane:{cost:4,webgl:'approx'},slices:{cost:3,webgl:'full'},shell:{cost:4,webgl:'approx'},
  lattice:{cost:4,webgl:'full'},truss:{cost:5,webgl:'full'},filaments:{cost:5,webgl:'approx'},braid:{cost:5,webgl:'approx'},
  ribbons:{cost:5,webgl:'approx'},contours:{cost:3,webgl:'full'},cells:{cost:4,webgl:'approx'},orbits:{cost:3,webgl:'full'},
  streams:{cost:6,webgl:'reduced'},spines:{cost:4,webgl:'full'},shards:{cost:4,webgl:'full'},cloud:{cost:6,webgl:'full'},halo:{cost:2,webgl:'full'}
};

export const DOMAIN_ORDER=['home','finance','restaurant','construction','investor','entrepreneur','ai','skills','hobbies'];

export const DOMAIN_GRAMMARS={
  home:{key:'H',eyebrow:'HOME / SUPERPOSITION',title:'Nine laws.<br>One field.',law:'superposition',lede:'All domain laws coexist at low amplitude. A curated master state is chosen deterministically at first load; later recipes expose the full procedural space.',
    required:['shell','filaments','ribbons','contours','cloud'],allow:SURFACE_FAMILIES,topologies:['hybrid-manifold','nested-orbit','folded-superposition','interference-shell'],layers:[12,16],spectral:{h:238,spread:122,c:.15,l:.74,groundH:242,groundL:.065}},
  finance:{key:'1',eyebrow:'01 / FINANCIAL EXECUTIVE',title:'Allocation.<br>Constraint.<br>Equilibrium.',law:'allocation',lede:'Nested reservoirs, manifolds and balance surfaces seek stable configurations without reducing finance to charts or literal money iconography.',
    required:['shell','ribbons','contours','streams','bands'],allow:['cloud','shell','ribbons','filaments','slices','orbits','streams','contours','bands','halo','membrane','braid'],topologies:['ellipsoid-ledger','lemniscate-balance','nested-reservoir','torus-equilibrium','saddle-allocation'],layers:[11,15],spectral:{h:222,spread:88,c:.14,l:.73,groundH:228,groundL:.055}},
  restaurant:{key:'2',eyebrow:'02 / RESTAURANT EXECUTIVE',title:'Capacity.<br>Flow.<br>Rhythm.',law:'flow',lede:'Throughput is rendered as braided circulation, reservoirs, service loops and queue-like stream structures that divide, recombine and clear.',
    required:['streams','braid','filaments','cells','contours'],allow:['cloud','ribbons','filaments','streams','contours','bands','braid','cells','membrane','orbits','halo'],topologies:['braided-circulation','reservoir-loop','service-vortex','split-rejoin','capacity-field'],layers:[11,15],spectral:{h:18,spread:118,c:.155,l:.72,groundH:350,groundL:.052}},
  construction:{key:'3',eyebrow:'03 / CONSTRUCTION EXECUTIVE',title:'Assembly.<br>Load.<br>Topology.',law:'structure',lede:'Structural grammars compile folded shells, trusses, sectional membranes, joints and load-like connective fields that can split and reconnect by seed.',
    required:['truss','shell','slices','filaments','lattice'],allow:['cloud','shell','ribbons','filaments','slices','truss','streams','shards','contours','bands','lattice','membrane','spines'],topologies:['folded-frame','vault-network','prismatic-section','woven-truss','tensegrity-field'],layers:[12,16],spectral:{h:38,spread:92,c:.14,l:.72,groundH:31,groundL:.052}},
  investor:{key:'4',eyebrow:'04 / INVESTOR & TRADER',title:'Uncertainty.<br>Horizon.<br>Optionality.',law:'uncertainty',lede:'Competing futures appear as sparse path ensembles, bifurcating surfaces and probability-like horizons. The state never resolves into a fake predictive chart.',
    required:['streams','contours','filaments','halo','membrane'],allow:['cloud','ribbons','filaments','streams','contours','bands','halo','membrane','orbits','spines'],topologies:['probability-fan','bifurcation-horizon','stochastic-saddle','attractor-fan','caustic-field'],layers:[10,14],spectral:{h:155,spread:132,c:.135,l:.70,groundH:164,groundL:.047}},
  entrepreneur:{key:'5',eyebrow:'05 / ENTREPRENEUR',title:'Branch.<br>Recombine.<br>Emerge.',law:'emergence',lede:'A generative growth law seeds branches, modular bodies and recombinant structures. Some paths survive; others dissolve back into the field.',
    required:['filaments','braid','shards','cells','streams'],allow:['cloud','ribbons','filaments','streams','shards','contours','bands','braid','cells','spines','halo','membrane'],topologies:['branching-growth','modular-bloom','recombinant-spiral','pruned-network','emergent-crown'],layers:[12,16],spectral:{h:306,spread:148,c:.16,l:.72,groundH:302,groundL:.052}},
  ai:{key:'6',eyebrow:'06 / AI & COMPUTER ENGINEERING',title:'Signal.<br>Recursion.<br>Computation.',law:'signal',lede:'Signals propagate through recursive lattices, folded manifolds and interference structures. This is the densest grammar but remains architectural rather than cyberpunk.',
    required:['lattice','streams','filaments','membrane','contours','spines'],allow:SURFACE_FAMILIES,topologies:['recursive-lattice','signal-manifold','interference-grid','feedback-shell','folded-compute'],layers:[13,16],spectral:{h:192,spread:178,c:.17,l:.75,groundH:211,groundL:.045}},
  skills:{key:'7',eyebrow:'07 / SKILLS',title:'Cluster.<br>Vector.<br>Bridge.',law:'vector',lede:'Capabilities form multi-lobe fields and cross-domain bridges. Density and geometry encode structure only; no invented proficiency percentages are introduced.',
    required:['cells','filaments','spines','contours','cloud'],allow:['cloud','filaments','contours','cells','spines','ribbons','orbits','streams','halo','lattice','braid'],topologies:['cluster-basis','multi-lobe','bridge-field','radial-basis','vector-territory'],layers:[11,15],spectral:{h:82,spread:238,c:.145,l:.72,groundH:86,groundL:.052}},
  hobbies:{key:'8',eyebrow:'08 / HOBBIES',title:'Explore.<br>Orbit.<br>Terrain.',law:'terrain',lede:'The personal regime is freer: topographic contours, orbital systems, rolling membranes and exploratory streams share the same renderer vocabulary with less convergence.',
    required:['contours','orbits','membrane','ribbons','halo'],allow:['cloud','shell','ribbons','filaments','orbits','streams','contours','bands','halo','membrane','braid','shards'],topologies:['topographic-basin','orbital-terrain','rolling-contour','exploration-shell','tidal-field'],layers:[11,15],spectral:{h:274,spread:160,c:.15,l:.75,groundH:268,groundL:.055}}
};

export const HOME_MASTER_SEEDS=[271828,161803,314159,57721,141421];
