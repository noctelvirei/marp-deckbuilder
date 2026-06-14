const staggerStepMs = 120

export function buildSlideTimingXml({ animation, targetIds }) {
  const ids = (targetIds || []).filter(Boolean)
  if (!animation || !ids.length) return ''

  const counter = { value: 5 }
  const effects = ids
    .map((targetId, index) => buildEntranceEffectXml({
      animation,
      targetId,
      nodeType: effectNodeType(animation, index),
      delayMs: effectDelay(animation, index),
      counter,
    }))
    .join('')
  const builds = ids.map((targetId) => `<p:bldP spid="${targetId}" grpId="0" animBg="1"/>`).join('')

  return `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst><p:par><p:cTn id="3" fill="hold"><p:stCondLst>${mainSequenceConditions(animation.trigger)}</p:stCondLst><p:childTnLst><p:par><p:cTn id="4" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>${effects}</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst><p:bldLst>${builds}</p:bldLst></p:timing>`
}

function buildEntranceEffectXml({ animation, targetId, nodeType, delayMs, counter }) {
  const effectId = nextId(counter)
  const pptx = animation.pptx
  const behaviors = [
    buildVisibilitySetXml({ targetId, counter }),
    ...(pptx.behaviors || []).map((behavior) => buildBehaviorXml({
      behavior,
      animation,
      targetId,
      counter,
    })),
  ].join('')

  return `<p:par><p:cTn id="${effectId}" presetID="${pptx.presetId}" presetClass="${pptx.presetClass}" presetSubtype="${pptx.presetSubtype}" fill="hold" grpId="0" nodeType="${nodeType}"><p:stCondLst><p:cond delay="${delayMs}"/></p:stCondLst><p:childTnLst>${behaviors}</p:childTnLst></p:cTn></p:par>`
}

function buildVisibilitySetXml({ targetId, counter }) {
  const setId = nextId(counter)

  return `<p:set><p:cBhvr><p:cTn id="${setId}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn><p:tgtEl><p:spTgt spid="${targetId}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>`
}

function buildBehaviorXml({ behavior, animation, targetId, counter }) {
  if (behavior.type === 'filter') {
    return buildFilterBehaviorXml({ behavior, animation, targetId, counter })
  }
  if (behavior.type === 'animate') {
    return buildAnimateBehaviorXml({ behavior, animation, targetId, counter })
  }
  throw new Error(`Unsupported PPTX animation behavior "${behavior.type}".`)
}

function buildFilterBehaviorXml({ behavior, animation, targetId, counter }) {
  const animId = nextId(counter)

  return `<p:animEffect transition="${behavior.transition}" filter="${behavior.filter}"><p:cBhvr><p:cTn id="${animId}" dur="${animation.durationMs}"/><p:tgtEl><p:spTgt spid="${targetId}"/></p:tgtEl></p:cBhvr></p:animEffect>`
}

function buildAnimateBehaviorXml({ behavior, animation, targetId, counter }) {
  const animId = nextId(counter)
  const additive = behavior.additive ? ` additive="${behavior.additive}"` : ''
  const fill = behavior.fill ? ` fill="${behavior.fill}"` : ''
  const values = behavior.values
    .map((value) => `<p:tav tm="${value.time}"><p:val>${timingValueXml(value)}</p:val></p:tav>`)
    .join('')

  return `<p:anim calcmode="lin" valueType="num"><p:cBhvr${additive}><p:cTn id="${animId}" dur="${animation.durationMs}"${fill}/><p:tgtEl><p:spTgt spid="${targetId}"/></p:tgtEl><p:attrNameLst><p:attrName>${behavior.attribute}</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst>${values}</p:tavLst></p:anim>`
}

function timingValueXml(value) {
  if (value.valueType === 'float') return `<p:fltVal val="${value.value}"/>`
  return `<p:strVal val="${value.value}"/>`
}

function mainSequenceConditions(trigger) {
  if (trigger === 'on-click') return '<p:cond delay="indefinite"/>'
  return '<p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond>'
}

function effectNodeType(animation, index) {
  if (index > 0 && animation.sequence === 'together') return 'withEffect'
  if (animation.trigger === 'on-click') return 'clickEffect'
  if (animation.trigger === 'with-previous') return 'withEffect'
  return 'afterEffect'
}

function effectDelay(animation, index) {
  if (animation.sequence !== 'stagger') return animation.delayMs
  if (animation.trigger === 'on-click') return animation.delayMs
  return animation.delayMs + index * staggerStepMs
}

function nextId(counter) {
  const id = counter.value
  counter.value += 1
  return id
}
