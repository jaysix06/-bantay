import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const animationDirectory = path.join(root, 'assets', 'animations');

const palette = {
  ink: '#3F1D0D',
  brown: '#7A4100',
  caramel: '#D99554',
  caramelDark: '#A95831',
  cream: '#FFF3DF',
  paper: '#FFFDF8',
  gold: '#FFC269',
  deepGold: '#E69729',
  green: '#256B3A',
  mint: '#8CD69E',
  blue: '#69B8DE',
  blueDark: '#327CA2',
  coral: '#F47C6C',
  coralDark: '#C94F45',
  peach: '#F4B88A',
  lavender: '#A99BD4',
};

function color(hex) {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16) / 255).concat(1);
}

const ease = {
  i: { x: [0.667], y: [1] },
  o: { x: [0.333], y: [0] },
};

function transform(position = [0, 0], scale = [100, 100], rotation = 0, opacity = 100) {
  return {
    ty: 'tr',
    p: { a: 0, k: position },
    a: { a: 0, k: [0, 0] },
    s: { a: 0, k: scale },
    r: { a: 0, k: rotation },
    o: { a: 0, k: opacity },
    sk: { a: 0, k: 0 },
    sa: { a: 0, k: 0 },
  };
}

const rect = (position, size, radius, name) => ({
  ty: 'rc', d: 1, p: { a: 0, k: position }, s: { a: 0, k: size }, r: { a: 0, k: radius }, nm: name,
});

const ellipse = (position, size, name) => ({
  ty: 'el', d: 1, p: { a: 0, k: position }, s: { a: 0, k: size }, nm: name,
});

function polygon(vertices, name, closed = true) {
  return {
    ind: 0,
    ty: 'sh',
    ks: {
      a: 0,
      k: {
        i: vertices.map(() => [0, 0]),
        o: vertices.map(() => [0, 0]),
        v: vertices,
        c: closed,
      },
    },
    nm: name,
  };
}

const fill = (hex, opacity = 100) => ({
  ty: 'fl', c: { a: 0, k: color(hex) }, o: { a: 0, k: opacity }, r: 1, bm: 0, nm: `Fill ${hex}`,
});

const stroke = (hex, width, opacity = 100) => ({
  ty: 'st', c: { a: 0, k: color(hex) }, o: { a: 0, k: opacity }, w: { a: 0, k: width }, lc: 2, lj: 2, ml: 4, bm: 0, nm: `Stroke ${hex}`,
});

function group(name, primitives, fillColor, options = {}) {
  const items = [...primitives];
  if (fillColor) items.push(fill(fillColor, options.fillOpacity ?? 100));
  if (options.stroke) items.push(stroke(options.stroke, options.strokeWidth ?? 3, options.strokeOpacity ?? 100));
  items.push(transform(options.position, options.scale, options.rotation, options.opacity));
  return { ty: 'gr', it: items, nm: name };
}

function loopPosition(x, y, duration, distance = 4, phase = 0) {
  const quarter = Math.round(duration / 4);
  return {
    a: 1,
    k: [
      { t: 0, s: [x, y + phase, 0], e: [x, y - distance, 0], ...ease },
      { t: quarter, s: [x, y - distance, 0], e: [x, y, 0], ...ease },
      { t: quarter * 2, s: [x, y, 0], e: [x, y + distance, 0], ...ease },
      { t: quarter * 3, s: [x, y + distance, 0], e: [x, y + phase, 0], ...ease },
      { t: duration, s: [x, y + phase, 0] },
    ],
  };
}

function shapeLayer(name, shapes, duration, options = {}) {
  return {
    ddd: 0,
    ind: 0,
    ty: 4,
    nm: `Illustration • ${name}`,
    sr: 1,
    ks: {
      o: options.opacity ?? { a: 0, k: 100 },
      r: options.rotation ?? { a: 0, k: 0 },
      p: options.position ?? { a: 0, k: [0, 0, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: options.scale ?? { a: 0, k: [100, 100, 100] },
    },
    ao: 0,
    shapes,
    ip: 0,
    op: duration,
    st: 0,
    bm: 0,
  };
}

function puppyLayer(x, y, duration, scale = 100, mood = 'happy') {
  const earDrop = mood === 'concerned' ? 8 : 0;
  const mouth = mood === 'concerned'
    ? polygon([[-10, 17], [0, 12], [10, 17]], 'Concerned mouth', false)
    : polygon([[-11, 11], [0, 18], [11, 11]], 'Happy mouth', false);

  const shapes = [
    group('Soft ground shadow', [ellipse([0, 72], [92, 20], 'Shadow')], palette.ink, { fillOpacity: 14 }),
    group('Body', [ellipse([0, 48], [78, 68], 'Body')], palette.caramel, { stroke: palette.caramelDark, strokeWidth: 3 }),
    group('Collar', [rect([0, 30], [72, 12], 6, 'Collar')], palette.coral, { stroke: palette.coralDark, strokeWidth: 2 }),
    group('Left ear', [polygon([[-31, -25], [-55, -50 + earDrop], [-48, 7]], 'Left ear')], palette.caramelDark, { stroke: palette.ink, strokeWidth: 3 }),
    group('Right ear', [polygon([[31, -25], [55, -50 + earDrop], [48, 7]], 'Right ear')], palette.caramelDark, { stroke: palette.ink, strokeWidth: 3 }),
    group('Head', [ellipse([0, -11], [92, 82], 'Head')], palette.caramel, { stroke: palette.ink, strokeWidth: 3 }),
    group('Forehead patch', [ellipse([-20, -29], [28, 34], 'Patch')], palette.cream),
    group('Muzzle', [ellipse([0, 7], [48, 34], 'Muzzle')], palette.cream),
    group('Eye whites', [ellipse([-19, -13], [17, 20], 'Left eye'), ellipse([19, -13], [17, 20], 'Right eye')], palette.paper),
    group('Pupils', [ellipse([-18, -11], [8, 11], 'Left pupil'), ellipse([18, -11], [8, 11], 'Right pupil')], palette.ink),
    group('Eye glints', [ellipse([-16, -14], [3, 4], 'Left glint'), ellipse([20, -14], [3, 4], 'Right glint')], palette.paper),
    group('Nose', [ellipse([0, 1], [15, 12], 'Nose')], palette.ink),
    group('Mouth', [mouth], null, { stroke: palette.ink, strokeWidth: 3 }),
    group('Tag', [ellipse([0, 38], [18, 18], 'Tag')], palette.gold, { stroke: palette.deepGold, strokeWidth: 2 }),
    group('Head highlight', [ellipse([25, -34], [14, 8], 'Highlight')], palette.peach, { fillOpacity: 75, rotation: -20 }),
  ];
  shapes.reverse();

  return shapeLayer('Puppy helper', shapes, duration, {
    position: loopPosition(x, y, duration, 4),
    scale: { a: 0, k: [scale, scale, 100] },
  });
}

function shelfLayer(duration, variant = 'shop') {
  const cloud = variant === 'offline'
    ? [
        group('Window', [rect([91, 104], [130, 112], 20, 'Window')], palette.blue, { fillOpacity: 26, stroke: palette.blueDark, strokeWidth: 4 }),
        group('Cloud', [ellipse([58, 98], [58, 34], 'Cloud left'), ellipse([91, 84], [70, 48], 'Cloud center'), ellipse([124, 101], [54, 31], 'Cloud right')], palette.paper, { stroke: palette.blueDark, strokeWidth: 3 }),
        group('Rain', [polygon([[60, 122], [54, 140]], 'Rain 1', false), polygon([[91, 122], [85, 145]], 'Rain 2', false), polygon([[122, 122], [116, 139]], 'Rain 3', false)], null, { stroke: palette.blueDark, strokeWidth: 5 }),
      ]
    : [
        group('Wall sun', [ellipse([76, 78], [74, 74], 'Sun')], palette.gold, { fillOpacity: 24 }),
        group('Wall tile', [rect([250, 92], [270, 16], 8, 'Tile')], palette.blue, { fillOpacity: 22 }),
      ];

  const shapes = [
    ...cloud,
    group('Shelf back', [rect([250, 302], [430, 112], 24, 'Shelf back')], palette.cream, { stroke: palette.deepGold, strokeWidth: 3, strokeOpacity: 45 }),
    group('Shelf shadow', [rect([250, 356], [446, 24], 12, 'Shelf shadow')], palette.ink, { fillOpacity: 13 }),
    group('Shelf plank', [rect([250, 344], [446, 22], 10, 'Shelf plank')], palette.brown),
    group('Coral cereal box', [rect([139, 286], [62, 93], 9, 'Box')], palette.coral, { stroke: palette.coralDark, strokeWidth: 3 }),
    group('Cereal label', [rect([139, 281], [43, 34], 8, 'Label')], palette.paper),
    group('Cereal mark', [ellipse([139, 280], [23, 18], 'Mark')], palette.gold),
    group('Blue bottle', [rect([219, 298], [47, 69], 20, 'Bottle'), rect([219, 255], [26, 20], 7, 'Neck')], palette.blue, { stroke: palette.blueDark, strokeWidth: 3 }),
    group('Bottle cap', [rect([219, 244], [29, 10], 4, 'Cap')], palette.blueDark),
    group('Bottle shine', [rect([207, 292], [7, 42], 4, 'Shine')], palette.paper, { fillOpacity: 66 }),
    group('Green tin', [rect([294, 305], [54, 56], 10, 'Tin')], palette.green, { stroke: palette.ink, strokeWidth: 3 }),
    group('Tin label', [rect([294, 307], [43, 22], 7, 'Label')], palette.mint),
    group('Purple pouch', [polygon([[345, 333], [355, 259], [405, 259], [417, 333]], 'Pouch')], palette.lavender, { stroke: palette.ink, strokeWidth: 3 }),
    group('Pouch fold', [polygon([[355, 270], [380, 281], [405, 270]], 'Fold', false)], null, { stroke: palette.paper, strokeWidth: 4, strokeOpacity: 75 }),
  ];
  shapes.reverse();
  return shapeLayer('Store shelf and products', shapes, duration);
}

function avatarLayer(duration) {
  const shapes = [
    group('Owner body', [ellipse([117, 223], [104, 118], 'Body')], palette.blueDark),
    group('Owner neck', [rect([117, 174], [28, 34], 12, 'Neck')], palette.peach),
    group('Owner face', [ellipse([117, 132], [78, 91], 'Face')], palette.peach, { stroke: palette.ink, strokeWidth: 3 }),
    group('Owner hair', [polygon([[78, 130], [84, 91], [105, 75], [139, 78], [157, 102], [153, 121], [136, 101], [105, 98]], 'Hair')], palette.ink),
    group('Owner smile', [polygon([[104, 148], [117, 155], [130, 148]], 'Smile', false)], null, { stroke: palette.ink, strokeWidth: 3 }),
    group('Family top body', [ellipse([402, 178], [88, 90], 'Body')], palette.coral),
    group('Family top face', [ellipse([402, 123], [64, 72], 'Face')], palette.caramel),
    group('Family top hair', [polygon([[371, 116], [378, 87], [405, 78], [433, 99], [432, 121], [414, 103], [389, 103]], 'Hair')], palette.caramelDark),
    group('Family bottom body', [ellipse([405, 340], [92, 94], 'Body')], palette.green),
    group('Family bottom face', [ellipse([405, 285], [66, 74], 'Face')], palette.peach),
    group('Family bottom hair', [polygon([[373, 282], [380, 247], [410, 239], [438, 263], [435, 289], [417, 266], [391, 269]], 'Hair')], palette.ink),
  ];
  shapes.reverse();
  return shapeLayer('Family characters', shapes, duration, { opacity: { a: 0, k: 68 } });
}

function sparkleLayer(duration, points) {
  const shapes = points.flatMap(([x, y, size, hex], index) => [
    group(`Spark ${index + 1}`, [polygon([[x, y - size], [x + size * 0.32, y - size * 0.32], [x + size, y], [x + size * 0.32, y + size * 0.32], [x, y + size], [x - size * 0.32, y + size * 0.32], [x - size, y], [x - size * 0.32, y - size * 0.32]], `Spark ${index + 1}`)], hex),
  ]);
  return shapeLayer('Color sparkles', shapes, duration, {
    opacity: {
      a: 1,
      k: [
        { t: 0, s: [25], e: [100], ...ease },
        { t: Math.round(duration * 0.25), s: [100], e: [35], ...ease },
        { t: Math.round(duration * 0.5), s: [35], e: [100], ...ease },
        { t: Math.round(duration * 0.75), s: [100], e: [25], ...ease },
        { t: duration, s: [25] },
      ],
    },
  });
}

function pulseRingLayer(name, x, y, width, height, hex, duration, start = 0) {
  const peak = Math.min(duration - 1, start + Math.round(duration * 0.2));
  const end = Math.min(duration, start + Math.round(duration * 0.42));
  return shapeLayer(name, [
    group('Pulse ring', [ellipse([0, 0], [width, height], 'Ring')], null, {
      stroke: hex,
      strokeWidth: 5,
      strokeOpacity: 88,
    }),
  ], duration, {
    position: { a: 0, k: [x, y, 0] },
    opacity: {
      a: 1,
      k: [
        { t: 0, s: [0], e: [0], ...ease },
        { t: start, s: [0], e: [88], ...ease },
        { t: peak, s: [88], e: [0], ...ease },
        { t: end, s: [0], e: [0], ...ease },
        { t: duration, s: [0] },
      ],
    },
    scale: {
      a: 1,
      k: [
        { t: 0, s: [72, 72, 100], e: [72, 72, 100], ...ease },
        { t: start, s: [72, 72, 100], e: [124, 124, 100], ...ease },
        { t: end, s: [124, 124, 100], e: [72, 72, 100], ...ease },
        { t: duration, s: [72, 72, 100] },
      ],
    },
  });
}

function scanFocusLayer(duration) {
  const corner = (x, y, sx, sy, label) => polygon([
    [x + 18 * sx, y], [x, y], [x, y + 18 * sy],
  ], label, false);
  return shapeLayer('Product scan focus', [
    group('Scanner corners', [
      corner(344, 183, 1, 1, 'Top left'),
      corner(435, 183, -1, 1, 'Top right'),
      corner(344, 318, 1, -1, 'Bottom left'),
      corner(435, 318, -1, -1, 'Bottom right'),
    ], null, { stroke: palette.blueDark, strokeWidth: 6 }),
  ], duration, {
    opacity: {
      a: 1,
      k: [
        { t: 0, s: [42], e: [100], ...ease },
        { t: 28, s: [100], e: [62], ...ease },
        { t: 60, s: [62], e: [100], ...ease },
        { t: 92, s: [100], e: [42], ...ease },
        { t: duration, s: [42] },
      ],
    },
  });
}

function scanBeamLayer(duration) {
  return shapeLayer('Animated barcode scan beam', [
    group('Soft beam glow', [rect([0, 0], [104, 16], 8, 'Glow')], palette.mint, { fillOpacity: 28 }),
    group('Scan line', [rect([0, 0], [104, 5], 3, 'Beam')], palette.green),
  ], duration, {
    position: {
      a: 1,
      k: [
        { t: 0, s: [390, 190, 0], e: [390, 307, 0], ...ease },
        { t: 48, s: [390, 307, 0], e: [390, 307, 0], ...ease },
        { t: 68, s: [390, 307, 0], e: [390, 190, 0], ...ease },
        { t: 116, s: [390, 190, 0], e: [390, 190, 0], ...ease },
        { t: duration, s: [390, 190, 0] },
      ],
    },
    opacity: {
      a: 1,
      k: [
        { t: 0, s: [0], e: [100], ...ease },
        { t: 8, s: [100], e: [100], ...ease },
        { t: 104, s: [100], e: [0], ...ease },
        { t: 116, s: [0], e: [0], ...ease },
        { t: duration, s: [0] },
      ],
    },
  });
}

function travelDotLayer(name, hex, duration, points, start = 0, size = 12) {
  const travelEnd = Math.min(duration - 12, start + Math.round(duration * 0.46));
  const times = points.map((_, index) => Math.round(start + ((travelEnd - start) * index) / (points.length - 1)));
  return shapeLayer(name, [
    group('Travel glow', [ellipse([0, 0], [size * 2.3, size * 2.3], 'Glow')], hex, { fillOpacity: 18 }),
    group('Travel dot', [ellipse([0, 0], [size, size], 'Dot')], hex, { stroke: palette.paper, strokeWidth: 2 }),
  ], duration, {
    position: {
      a: 1,
      k: [
        { t: 0, s: [...points[0], 0], e: [...points[0], 0], ...ease },
        ...points.slice(0, -1).map((point, index) => ({
          t: times[index],
          s: [...point, 0],
          e: [...points[index + 1], 0],
          ...ease,
        })),
        { t: travelEnd, s: [...points.at(-1), 0], e: [...points.at(-1), 0], ...ease },
        { t: duration, s: [...points[0], 0] },
      ],
    },
    opacity: {
      a: 1,
      k: [
        { t: 0, s: [0], e: [0], ...ease },
        { t: start, s: [0], e: [100], ...ease },
        { t: start + 8, s: [100], e: [100], ...ease },
        { t: travelEnd - 8, s: [100], e: [0], ...ease },
        { t: travelEnd, s: [0], e: [0], ...ease },
        { t: duration, s: [0] },
      ],
    },
  });
}

function linkBurstLayer(duration) {
  return shapeLayer('Linked-device confirmation burst', [
    group('Link rays', [
      polygon([[-48, 0], [-67, 0]], 'Left ray', false),
      polygon([[48, 0], [67, 0]], 'Right ray', false),
      polygon([[0, -32], [0, -51]], 'Top ray', false),
      polygon([[-34, -23], [-48, -37]], 'Upper-left ray', false),
      polygon([[34, -23], [48, -37]], 'Upper-right ray', false),
    ], null, { stroke: palette.blueDark, strokeWidth: 5 }),
  ], duration, {
    position: { a: 0, k: [400, 226, 0] },
    opacity: {
      a: 1,
      k: [
        { t: 0, s: [0], e: [0], ...ease },
        { t: 70, s: [0], e: [100], ...ease },
        { t: 84, s: [100], e: [0], ...ease },
        { t: 104, s: [0], e: [0], ...ease },
        { t: duration, s: [0] },
      ],
    },
    scale: {
      a: 1,
      k: [
        { t: 0, s: [70, 70, 100], e: [70, 70, 100], ...ease },
        { t: 70, s: [70, 70, 100], e: [112, 112, 100], ...ease },
        { t: 104, s: [112, 112, 100], e: [70, 70, 100], ...ease },
        { t: duration, s: [70, 70, 100] },
      ],
    },
  });
}

/* Legacy vector-only scene builder retained as design history.
function enrich(name, buildLayers) {
  const file = path.join(animationDirectory, name);
  const animation = JSON.parse(fs.readFileSync(file, 'utf8'));
  animation.layers = animation.layers.filter((layer) => !layer.nm?.startsWith('Illustration •'));
  const priceDetails = animation.layers.find((layer) => layer.nm === 'Price details');
  if (priceDetails) {
    const stripY = name === 'offline-price.json' ? 47 : 46;
    priceDetails.shapes = [
      group('Readable price marks', [
        rect([-66, -31], [90, 15], 7, 'Product line'),
        rect([38, stripY], [126, 24], 8, 'Price line'),
      ], palette.ink),
      group('Cream price strip', [rect([0, stripY], [238, 38], 10, 'Price strip')], palette.cream),
    ];
  }
  const deviceScreens = animation.layers.find((layer) => layer.nm === 'Device screens');
  if (deviceScreens) {
    deviceScreens.shapes = [
      group('Screen price marks', [
        rect([150, 199], [34, 12], 5, 'Owner price'),
        rect([350, 139], [27, 10], 4, 'Top price'),
        rect([350, 269], [27, 10], 4, 'Bottom price'),
      ], palette.ink),
      group('Cream device screens', [
        rect([150, 198], [50, 76], 8, 'Owner screen'),
        rect([350, 138], [42, 55], 7, 'Top screen'),
        rect([350, 268], [42, 55], 7, 'Bottom screen'),
      ], palette.cream),
    ];
  }
  const { foreground = [], background = [] } = buildLayers(animation.op);
  animation.layers = [...foreground, ...animation.layers, ...background];
  animation.layers.forEach((layer, index) => { layer.ind = index + 1; });
  animation.meta = {
    ...(animation.meta ?? {}),
    d: `${animation.nm} onboarding scene with layered cartoon store illustration.`,
  };
  fs.writeFileSync(file, `${JSON.stringify(animation, null, 2)}\n`);
}

enrich('scan-price.json', (duration) => ({
  foreground: [
    sparkleLayer(duration, [[85, 88, 11, palette.coral], [413, 102, 9, palette.blue], [432, 238, 7, palette.green]]),
    puppyLayer(82, 308, duration, 72, 'happy'),
  ],
  background: [shelfLayer(duration, 'shop')],
}));

enrich('shared-price.json', (duration) => ({
  foreground: [
    sparkleLayer(duration, [[244, 76, 10, palette.gold], [286, 105, 7, palette.blue], [262, 330, 8, palette.coral]]),
    puppyLayer(250, 337, duration, 55, 'happy'),
  ],
  background: [avatarLayer(duration)],
}));

enrich('offline-price.json', (duration) => ({
  foreground: [
    sparkleLayer(duration, [[413, 217, 9, palette.mint], [393, 341, 7, palette.gold], [163, 96, 7, palette.blue]]),
    puppyLayer(88, 306, duration, 70, 'concerned'),
  ],
  background: [shelfLayer(duration, 'offline')],
}));
*/

function mascotImageLayer(assetId, duration) {
  const mid = Math.round(duration / 2);
  return {
    ddd: 0,
    ind: 1,
    ty: 2,
    nm: 'Exact Bantay mascot pose',
    refId: assetId,
    sr: 1,
    ks: {
      o: { a: 0, k: 100 },
      r: { a: 0, k: 0 },
      p: {
        a: 1,
        k: [
          { t: 0, s: [250, 210, 0], e: [250, 204, 0], ...ease },
          { t: mid, s: [250, 204, 0], e: [250, 210, 0], ...ease },
          { t: duration, s: [250, 210, 0] },
        ],
      },
      a: { a: 0, k: [250, 250, 0] },
      s: {
        a: 1,
        k: [
          { t: 0, s: [100, 100, 100], e: [101.5, 101.5, 100], ...ease },
          { t: mid, s: [101.5, 101.5, 100], e: [100, 100, 100], ...ease },
          { t: duration, s: [100, 100, 100] },
        ],
      },
    },
    ao: 0,
    ip: 0,
    op: duration,
    st: 0,
    bm: 0,
  };
}

function hybridize(name, imageName, duration, sparkles, effects = []) {
  const file = path.join(animationDirectory, name);
  const animation = JSON.parse(fs.readFileSync(file, 'utf8'));
  animation.op = duration;
  const imagePath = path.join(root, 'assets', 'images', 'onboarding', 'lottie', imageName);
  const assetId = `mascot-${path.basename(imageName, '.png')}`;
  animation.assets = [{
    id: assetId,
    w: 500,
    h: 500,
    u: '',
    p: `data:image/png;base64,${fs.readFileSync(imagePath).toString('base64')}`,
    e: 1,
  }];
  animation.layers = [...effects, sparkleLayer(duration, sparkles), mascotImageLayer(assetId, duration)];
  animation.layers.forEach((layer, index) => { layer.ind = index + 1; });
  animation.meta = {
    ...(animation.meta ?? {}),
    d: `${animation.nm} scene using the exact mascot artwork with lightweight looping vector effects.`,
  };
  fs.writeFileSync(file, `${JSON.stringify(animation, null, 2)}\n`);
}

hybridize('scan-price.json', 'mascot-scan.png', 120, [
  [74, 89, 11, palette.coral], [424, 99, 9, palette.blue], [436, 251, 7, palette.green],
], [
  pulseRingLayer('Scan success pulse', 390, 252, 94, 130, palette.green, 120, 64),
  scanBeamLayer(120),
  scanFocusLayer(120),
]);
hybridize('shared-price.json', 'mascot-share.png', 150, [
  [80, 91, 10, palette.gold], [423, 94, 8, palette.blue], [430, 318, 8, palette.coral],
], [
  linkBurstLayer(150),
  pulseRingLayer('Primary link pulse', 400, 226, 72, 52, palette.blue, 150, 70),
  pulseRingLayer('Secondary link pulse', 400, 226, 72, 52, palette.mint, 150, 96),
  travelDotLayer('Price answer travelling', palette.gold, 150, [[130, 203], [214, 139], [306, 139], [395, 208]], 14, 13),
  travelDotLayer('Linked answer echo', palette.blue, 150, [[130, 218], [218, 160], [310, 158], [402, 224]], 34, 9),
]);
hybridize('offline-price.json', 'mascot-offline.png', 150, [
  [82, 93, 9, palette.mint], [420, 95, 8, palette.gold], [424, 326, 7, palette.blue],
], [
  pulseRingLayer('Weak signal fade', 386, 169, 66, 50, palette.coral, 150, 12),
  travelDotLayer('Saved data settles locally', palette.mint, 150, [[386, 174], [376, 220], [369, 265], [369, 330]], 38, 11),
  pulseRingLayer('Saved check confirmation', 369, 260, 78, 78, palette.green, 150, 62),
  pulseRingLayer('Saved price confirmation', 369, 335, 128, 94, palette.gold, 150, 88),
]);

console.log('Enriched scan-price.json, shared-price.json, and offline-price.json');
