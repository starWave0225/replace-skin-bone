/** The standalone release ends at the prologue curtain and owns its saves. */
export const isPrologueDemo = import.meta.env?.VITE_DEMO_MODE === 'prologue'
export const saveDatabaseName = isPrologueDemo ? 'qianmian-prologue-demo-v1' : 'borrowed-face-v1'
