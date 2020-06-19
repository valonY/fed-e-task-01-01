const proxyCache = new WeakMap()
const originCache = new WeakMap()
const isObject = val => val && typeof val === 'object'

const baseHandler = (parentKey = '') => ({
  get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver)
    collect(key)
    return isObject(res) ? reactive(res, key) : res
  },
  set(target, key, value, receiver) {
    const oldValue = target[key], newValue = value
    const result = Reflect.set(target, key, value, receiver)
    let changeKey = key
    if (parentKey) changeKey = `${parentKey}.${key}`
    if (oldValue === newValue) return result
    dispatch(key, { changeKey, oldValue, newValue })
    return result
  },
})

function collect (key) {
  const curEffect = effect.curEffect
  if (!curEffect) return
  if (!collect.depsMap) collect.depsMap = {}
  const depWatchers = collect.depsMap[key]
  if (!depWatchers) collect.depsMap[key] = []
  if (collect.depsMap[key].includes(curEffect)) return
  collect.depsMap[key].push(curEffect)
}

function dispatch(key, state) {
  collect.depsMap[key].forEach(depFn => depFn(state))
}

function reactive (target, parentKey = '') {
  const observe = proxyCache.get(target)
  if (observe) return observe
  // 传入的对象可能是一个已经被代理过的对象
  if (originCache.has(target)) return target

  const newObserve = new Proxy(target, baseHandler(parentKey))
  proxyCache.set(target, newObserve)
  originCache.set(newObserve, target)
  return newObserve
}

function effect (fn) {
  effect.curEffect = fn
  fn({})
  effect.curEffect = null
}

const data = reactive({
  name: 'name',
  age: 12,
  next: {
    value: '23333'
  }
})

effect((state) => {
  console.log(`${data.name}---${data.age}-${data.next.value}`, state)
})