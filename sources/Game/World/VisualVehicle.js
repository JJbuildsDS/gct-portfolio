import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { Track } from '../Tracks.js'
import { Trails } from '../Trails.js'
import { remapClamp } from '../utilities/maths.js'
import { cameraPosition, color, Fn, min, mix, normalWorld, positionViewDirection, positionWorld, screenCoordinate, texture, uniform, uv, vec2, vec3, vec4 } from 'three/tsl'
import { clamp } from 'three/src/math/MathUtils.js'
import gsap from 'gsap'
import { MeshDefaultMaterial } from '../Materials/MeshDefaultMaterial.js'

export class VisualVehicle
{
    constructor(model)
    {
        this.game = Game.getInstance()
        
        this.model = model

        this.setParts()
        this.setMainGroundTrack()
        this.setWheels()
        this.setBlinkers()
        this.setBackLights()
        this.setAntenna()
        this.setBoostTrails()
        this.setBoostAnimation()
        this.setScreenPosition()
        this.setPaints()
        this.setChicken() // GCT: replace car with chicken mesh + hide car parts

        this.tickCallback = () =>
        {
            this.update()
        }
        this.game.ticker.events.on('tick', this.tickCallback, 8)
    }

    destroy()
    {
        this.game.ticker.events.off('tick', this.tickCallback)

        if(this.blinkers)
        {
            this.game.inputs.events.off('left', this.blinkers.leftCallback)
            this.game.inputs.events.off('right', this.blinkers.rightCallback)
        }

        for(let partName in this.parts)
        {
            const part = this.parts[partName]
            part.removeFromParent()
        }

        this.game.tracks.remove(this.mainGroundTrack)

        for(const wheel of this.wheels.items)
        {
            this.game.tracks.remove(wheel.groundTrack)
        }
    }

    setParts()
    {
        this.parts = {}

        const searchList = [
            'bodyPainted',
            'chassis',
            'blinkerLeft',
            'blinkerRight',
            'stopLights',
            'backLights',
            'wheelContainer',
            'antenna',
            'cell1',
            'cell2',
            'cell3',
            'energy',
        ]
        for(let i = 0; i < searchList.length; i++)
        {
            searchList[i] = new RegExp(`^(${searchList[i]})`, 'i')
        }

        this.model.traverse((child) =>
        {
            if(child.isMesh)
            {
                child.receiveShadow = true
                child.castShadow = true
                child.material.shadowSide = THREE.BackSide
            }

            for(const search of searchList)
            {
                const match = child.name.match(search)

                if(match)
                {
                    this.parts[match[0]] = child
                }
            }
        })

        // Chassis
        this.parts.chassis.rotation.reorder('YXZ')
        this.game.materials.updateObject(this.parts.chassis)
        this.game.scene.add(this.parts.chassis)

        // Blinker left
        if(this.parts.blinkerLeft)
            this.parts.blinkerLeft.visible = false

        // Blinker right
        if(this.parts.blinkerRight)
            this.parts.blinkerRight.visible = false

        // Stop lights
        if(this.parts.stopLights)
            this.parts.stopLights.visible = false

        // Back lights
        if(this.parts.backLights)
            this.parts.backLights.visible = false

        // Wheel
        this.game.materials.updateObject(this.parts.wheelContainer)
    }

    setPaints()
    {
        this.paints = {}

        this.paints.choices = {}
        this.paints.choices.red = this.game.materials.getFromName('redGradient')
        this.paints.choices.orange = this.game.materials.createGradient('orangeGradient', '#ff940d', '#af0071', this.game.materials.debugPanel?.addFolder({ title: 'orangeGradient' }))
        this.paints.choices.white = this.game.materials.createGradient('whiteGradient', '#ffffff', '#b5b5b5', this.game.materials.debugPanel?.addFolder({ title: 'whiteGradient' }))
        this.paints.choices.black = this.game.materials.createGradient('blackGradient', '#626262', '#262526', this.game.materials.debugPanel?.addFolder({ title: 'blackGradient' }))
        
        // Flames
        {
            const material = this.paints.choices.red.clone()
            const baseOutput = material.outputNode
            const colorA = uniform(color('#ff9c20'))
            const colorB = uniform(color('#ff0000'))
            const emissiveStrength = uniform(7.75)

            material.outputNode = Fn(() =>
            {
                // Flames
                {
                    const newUv = uv(1).toVar()
                    const uv3 = newUv.sub(vec2(0, this.game.ticker.elapsedScaledUniform.mul(-0.075))).mul(vec2(0.96 * 1.3, 0.35 * 1.3))
                    const noise3 = texture(this.game.noises.voronoi, uv3).r

                    const uv4 = newUv.sub(vec2(0, this.game.ticker.elapsedScaledUniform.mul(-0.041))).mul(vec2(1.28 * 1.3, 0.75 * 1.3))
                    const noise4 = texture(this.game.noises.voronoi, uv4).r

                    const noiseFinal = min(noise3, noise4)
                    const stepTreshold = newUv.y.oneMinus()
                    const flameMix = noiseFinal.step(stepTreshold)

                    const flameColor = mix(colorA, colorB, newUv.y).mul(emissiveStrength)

                    baseOutput.rgb.assign(mix(baseOutput.rgb, flameColor, flameMix))
                }


                return baseOutput
            })()

            this.paints.choices.flames = material

            // Debug
            if(this.game.debug.active && this.game.materials.debugPanel)
            {
                const debugPanel = this.game.materials.debugPanel.addFolder({
                    title: 'flames',
                    expanded: true,
                })
                this.game.debug.addThreeColorBinding(debugPanel, colorA.value, 'flamesColorA')
                this.game.debug.addThreeColorBinding(debugPanel, colorB.value, 'flamesColorB')
                debugPanel.addBinding(emissiveStrength, 'value', { label: 'emissiveStrength', min: 1, max: 10, step: 0.001 })
            }
        }
        
        // Abyssal
        {
            const material = new THREE.MeshBasicMaterial({ wireframe: false })
            const fresnelColor = uniform(color('#6053ff'))
            const fresnelIntensity = uniform(30)
            const starsIntensity = uniform(10)

            material.outputNode = Fn(() =>
            {
                const starsUv = screenCoordinate.div(256).fract()
                const starsColor = texture(this.game.resources.behindTheSceneStarsTexture, starsUv).rgb.pow(2).mul(starsIntensity)
				
                const viewDirection = positionWorld.sub( cameraPosition ).normalize();
                const fresnel = viewDirection.dot(normalWorld).remapClamp(-0.2, -0.4, 1, 0)
                
                const fresnelFinalColor = fresnelColor.mul(fresnelIntensity)
                const finalColor = mix(starsColor, fresnelFinalColor, fresnel)

                finalColor.assign(MeshDefaultMaterial.revealDiscardNodeBuilder(this.game, finalColor))

                return vec4(finalColor, 1)
            })()

            this.paints.choices.abyssal = material

            // Debug
            if(this.game.debug.active && this.game.materials.debugPanel)
            {
                const debugPanel = this.game.materials.debugPanel.addFolder({
                    title: 'abyssal',
                    expanded: true,
                })
                this.game.debug.addThreeColorBinding(debugPanel, fresnelColor.value, 'fresnelColor')
                debugPanel.addBinding(fresnelIntensity, 'value', { label: 'fresnelIntensity', min: 1, max: 40, step: 0.001 })
                debugPanel.addBinding(starsIntensity, 'value', { label: 'starsIntensity', min: 1, max: 40, step: 0.001 })
            }
        }

        this.paints.changeTo = (name = 'red') =>
        {
            const material = this.paints.choices[name]

            if(!material)
                return false

            this.parts.bodyPainted.material = material

            for(const wheel of this.wheels.items)
            {
                if(wheel.painted)
                    wheel.painted.material = material
            }
        }
        
        // From achievemnts
        this.paints.changeTo(this.game.achievements.rewards.current.name)

        this.game.achievements.events.on('rewardActiveChange', (reward) =>
        {
            this.paints.changeTo(reward.name)
        })
    }

    setMainGroundTrack()
    {
        this.mainGroundTrack = this.game.tracks.add(new Track(1.5, 'g'))
    }

    setWheels()
    {
        // Setup
        this.wheels = {}
        this.wheels.items = []
        this.wheels.steering = 0

        // Create wheels
        for(let i = 0; i < 4; i++)
        {
            const wheel = {}

            // Clone group
            wheel.container = this.parts.wheelContainer.clone(true)
            this.parts.chassis.add(wheel.container)

            wheel.container.traverse((child) =>
            {
                if(child.name.match(/^wheelSuspension/))
                    wheel.suspension = child
                if(child.name.match(/^wheelCylinder/))
                    wheel.cylinder = child
                if(child.name.match(/^wheelPainted/))
                    wheel.painted = child
            })
            
            // Cylinder (actual wheel)
            wheel.cylinder.position.set(0, 0, 0)
            
            if(i === 0 || i === 2)
                wheel.container.rotation.y = Math.PI

            // Add new track
            wheel.groundTrack = this.game.tracks.add(new Track(0.5, 'r'))

            this.wheels.items.push(wheel)
        }
    }

    setBlinkers()
    {
        if(!this.parts.blinkerLeft)
            return
            
        this.blinkers = {}

        let running = false
        let on = false

        const start = () =>
        {
            if(running)
                return

            running = true
            on = true

            this.parts.blinkerLeft.visible = this.game.inputs.actions.get('left').active ? on : false
            this.parts.blinkerRight.visible = this.game.inputs.actions.get('right').active ? on : false

            gsap.delayedCall(0.8, blink)
        }

        const blink = () =>
        {
            on = !on

            this.parts.blinkerLeft.visible = this.game.inputs.actions.get('left').active ? on : false
            this.parts.blinkerRight.visible = this.game.inputs.actions.get('right').active ? on : false

            if(!this.game.inputs.actions.get('left').active && !this.game.inputs.actions.get('right').active && !on)
            {
                running = false
            }
            else
            {
                gsap.delayedCall(0.8, blink)
            }
        }

        this.blinkers.leftCallback = (active) =>
        {
            if(active.active)
                start()
        }
        
        this.blinkers.rightCallback = (active) =>
        {
            if(active.active)
                start()
        }

        this.game.inputs.events.on('left', this.blinkers.leftCallback)
        this.game.inputs.events.on('right', this.blinkers.rightCallback)
    }

    setBackLights()
    {
        this.backLights = {}
        this.backLights.material = new THREE.MeshBasicNodeMaterial({ colorNode: vec3(2.2) })
    }

    setAntenna()
    {
        if(!this.parts.antenna)
            return

        this.antenna = {}
        this.antenna.target = new THREE.Vector3(0, 2, 0)
        this.antenna.target = new THREE.Vector3(0, 2, 0)
        this.antenna.object = this.parts.antenna
        this.antenna.head = this.game.resources.vehicle.scene.getObjectByName('antennaHead')
        this.antenna.headAxle = this.antenna.head.children[0]
        this.antenna.headReference = this.antenna.object.getObjectByName('antennaHeadReference')

        this.game.materials.updateObject(this.antenna.head)
        this.game.scene.add(this.antenna.head)
    }

    setBoostTrails()
    {
        this.boostTrails = {}
        this.boostTrails.instance = new Trails()

        this.boostTrails.leftReference = new THREE.Object3D()
        this.boostTrails.leftReference.position.set(-1.28, 0.1, -0.55)
        this.parts.chassis.add(this.boostTrails.leftReference)

        this.boostTrails.left = this.boostTrails.instance.create()
        this.boostTrails.leftReference.getWorldPosition(this.boostTrails.left.position)
    
        this.boostTrails.rightReference = new THREE.Object3D()
        this.boostTrails.rightReference.position.set(-1.28, 0.1, 0.55)
        this.parts.chassis.add(this.boostTrails.rightReference)

        this.boostTrails.right = this.boostTrails.instance.create()
        this.boostTrails.rightReference.getWorldPosition(this.boostTrails.right.position)
    }

    setBoostAnimation()
    {
        this.boostAnimation = {}
        this.boostAnimation.mix = 0
        this.boostAnimation.speed = 1.2
        this.boostAnimation.mixUniform = uniform(0)

        // Energy
        if(this.parts.energy)
        {
            const emissiveOuput = this.game.materials.getFromName('emissivePurpleRadialGradient').outputNode
            const defaultOutput = this.parts.energy.material.outputNode

            const material = new THREE.MeshLambertNodeMaterial()
            material.outputNode = mix(defaultOutput, emissiveOuput, this.boostAnimation.mixUniform)

            this.parts.energy.material = material
        }
    }

    setScreenPosition()
    {
        this.screenPosition = new THREE.Vector2(0, 0)
    }

    /**
     * GCT: load chicken, scale to car size, hide car body + wheels.
     *
     * The Poly Pizza chicken is one GLB mesh with 5 primitives (by color).
     * Per ARCHITECTURE.md §9, we do NOT have separate head/wing submeshes,
     * so head-bob + wing-flap become a whole-body procedural bob (pitch on
     * accel, roll on turn, Y bounce scaled by speed).
     *
     * The chicken paintable region = the primitive whose source material was
     * named 'FFFFFF' (the white body). Accent colors (beak, comb, feet) are
     * preserved by re-wrapping in MeshLambertNodeMaterial (TSL-compatible).
     */
    setChicken()
    {
        const chickenResource = this.game.resources.chicken
        if(!chickenResource || !chickenResource.scene)
        {
            console.warn('[VisualVehicle] chicken resource missing; falling back to car visuals')
            return
        }

        // Clone so we don't mutate the shared loaded scene
        const chickenInner = chickenResource.scene.clone(true)

        // Scale from model space (~190u tall) down to vehicle bounds (~2.3u tall)
        const CHICKEN_SCALE = 0.012
        chickenInner.scale.setScalar(CHICKEN_SCALE)

        // Nudge feet toward ground plane. Chassis center sits ~0.5u above
        // ground; chicken feet at local Y=0 after scale means we subtract
        // that offset to plant the feet where wheels contact.
        chickenInner.position.y = -0.5

        // The Poly Pizza chicken model faces +X in model space. Bruno's car
        // chassis faces -X (wheel 0 is "front" at rotation.y = Math.PI).
        // Rotate 180° so the beak points forward along the car's heading.
        chickenInner.rotation.y = Math.PI

        // Walk the chicken, convert PBR materials to TSL-compatible Lambert
        // node materials (preserves hex color), flag the body mesh for paint.
        chickenInner.traverse((child) =>
        {
            if(!child.isMesh) return

            child.castShadow = true
            child.receiveShadow = true

            const src = child.material
            const hexName = src && src.name ? src.name.toUpperCase() : null
            const srcColor = (src && src.color) ? src.color : new THREE.Color(0xffffff)

            const newMat = new THREE.MeshLambertNodeMaterial({ color: srcColor.clone() })
            // Allow shadow self-intersection avoidance like Bruno's car materials
            newMat.shadowSide = THREE.BackSide
            child.material = newMat

            // The FFFFFF (white body) primitive = paintable region
            if(hexName === 'FFFFFF')
            {
                this.parts.chickenBody = child
                // Track original mat so we can restore if needed
                this.parts.chickenBody.userData.originalColor = srcColor.getHex()
            }
        })

        // Top-level group that the physics sync writes to
        this.parts.chicken = new THREE.Group()
        this.parts.chicken.rotation.reorder('YXZ')
        this.parts.chicken.add(chickenInner)
        this.parts.chickenInner = chickenInner
        this.game.scene.add(this.parts.chicken)

        // Procedural bob state
        this.chickenBob = {
            time: 0,
            amplitude: 0.10,
            frequency: 14,
            pitch: 0,
            roll: 0,
        }

        // Hide the car's visible parts. Physics wheels + colliders remain
        // untouched — we just don't render the visual car.
        if(this.parts.chassis) this.parts.chassis.visible = false
        if(this.parts.bodyPainted) this.parts.bodyPainted.visible = false
        if(this.wheels && this.wheels.items)
        {
            for(const wheel of this.wheels.items)
            {
                if(wheel.container) wheel.container.visible = false
            }
        }

        // Hook the skin system to target the chicken's body primitive.
        // Bruno's setPaints ran before us and already initialized this.paints,
        // but the default skin application happens at line ~241 via
        // `this.paints.changeTo(this.game.achievements.rewards.current.name)`.
        // That path sets `this.parts.bodyPainted.material = material`. We swap
        // it to write to the chicken body instead.
        const originalChangeTo = this.paints.changeTo
        this.paints.changeTo = (name = 'red') =>
        {
            const material = this.paints.choices[name]
            if(!material) return false
            if(this.parts.chickenBody)
            {
                this.parts.chickenBody.material = material
            }
            // Also set on the (hidden) car body for consistency, so any other
            // system that reads bodyPainted.material sees the right one.
            if(this.parts.bodyPainted)
            {
                this.parts.bodyPainted.material = material
            }
            return true
        }

        // Apply the current reward paint now that the binding is rewired.
        const currentReward = this.game.achievements?.rewards?.current?.name
        if(currentReward)
        {
            this.paints.changeTo(currentReward)
        }
    }

    update()
    {
        const physicalVehicle = this.game.physicalVehicle

        // Chassis (always updated even when hidden — children may still need world transforms)
        this.parts.chassis.position.copy(physicalVehicle.position)
        this.parts.chassis.quaternion.copy(physicalVehicle.quaternion)

        // GCT: sync chicken group to physics + apply procedural whole-body bob
        if(this.parts.chicken && this.parts.chickenInner)
        {
            this.parts.chicken.position.copy(physicalVehicle.position)
            this.parts.chicken.quaternion.copy(physicalVehicle.quaternion)

            const dt = this.game.ticker.deltaScaled
            this.chickenBob.time += dt

            // Y bob: strong when moving, tiny idle breath when still
            const speed = Math.abs(physicalVehicle.forwardSpeed || 0)
            const movingFactor = Math.min(speed / 10, 1)
            const bobAmt = movingFactor > 0.01
                ? Math.sin(this.chickenBob.time * this.chickenBob.frequency) * this.chickenBob.amplitude * movingFactor
                : Math.sin(this.chickenBob.time * 2.5) * 0.015

            // Re-apply the -0.5 base offset then layer the bob
            this.parts.chickenInner.position.y = -0.5 + bobAmt

            // Pitch: lean forward when accelerating, back when braking
            const forwardInput = (this.game.inputs.actions.get('forward').active ? 1 : 0)
                                - (this.game.inputs.actions.get('backward').active ? 1 : 0)
            const pitchTarget = -forwardInput * 0.18
            this.chickenBob.pitch += (pitchTarget - this.chickenBob.pitch) * dt * 6

            // Roll: bank into turns (steering already smoothed above in wheel code — use it on next frame)
            const rollTarget = -(this.wheels?.steering || 0) * 0.35
            this.chickenBob.roll += (rollTarget - this.chickenBob.roll) * dt * 6

            this.parts.chickenInner.rotation.x = this.chickenBob.pitch
            // Z roll is in the INNER group's local frame; because we rotated
            // the inner group 180° on Y, a +Z roll from steering becomes the
            // visually-correct bank. Keep sign consistent.
            this.parts.chickenInner.rotation.z = this.chickenBob.roll
        }
        
        // Wheels
        this.wheels.steering += ((this.game.player.steering * physicalVehicle.steeringAmplitude) - this.wheels.steering) * this.game.ticker.deltaScaled * 16

        const wheelsRotation = (physicalVehicle.forwardSpeed) / physicalVehicle.wheels.settings.radius * 0.006

        for(let i = 0; i < 4; i++)
        {
            const visualWheel = this.wheels.items[i]
            const physicalWheel = physicalVehicle.wheels.items[i]

            // visualWheel.container.position.copy(physicalWheel.basePosition)

            if(!this.game.inputs.actions.get('brake').active || this.game.inputs.actions.get('forward').active || this.game.inputs.actions.get('backward').active)
            {
                if(i === 0 || i === 2)
                    visualWheel.cylinder.rotation.z += wheelsRotation
                else
                    visualWheel.cylinder.rotation.z -= wheelsRotation
            }

            if(i === 0)
                visualWheel.container.rotation.y = Math.PI + this.wheels.steering

            if(i === 1)
                visualWheel.container.rotation.y = this.wheels.steering
  
            const suspensionLength = physicalWheel.suspensionLength
            let wheelY = physicalWheel.basePosition.y - suspensionLength
            wheelY = Math.min(wheelY, -0.5)

            visualWheel.container.position.x = physicalWheel.basePosition.x
            visualWheel.container.position.y += (wheelY - visualWheel.container.position.y) * 25 * this.game.ticker.deltaScaled
            visualWheel.container.position.z = physicalWheel.basePosition.z

            if(visualWheel.suspension)
            {
                const suspensionScale = Math.abs(visualWheel.container.position.y) - 0.5
                visualWheel.suspension.scale.y = suspensionScale
            }

            // Ground tracks
            visualWheel.groundTrack.update(physicalWheel.contactPoint, physicalWheel.inContact)
        }

        // Main ground track
        this.mainGroundTrack.update(physicalVehicle.position, physicalVehicle.position.y < 1.5)

        // Antenna
        if(this.antenna)
        {
            const angle = Math.atan2(this.antenna.target.x - physicalVehicle.position.x, this.antenna.target.z - physicalVehicle.position.z)
            this.antenna.object.rotation.y = angle - this.parts.chassis.rotation.y
            this.antenna.headReference.getWorldPosition(this.antenna.head.position)
            this.antenna.head.lookAt(this.antenna.target)

            const antennaTargetDistance = this.antenna.target.distanceTo(physicalVehicle.position)
            
            const antennaRotationSpeed = remapClamp(antennaTargetDistance, 50, 5, 1, 10)
            this.antenna.headAxle.rotation.z += this.game.ticker.deltaScaled * antennaRotationSpeed
        }

        // Stop/back lights
        if(this.game.player.braking)
        {
            if(this.parts.stopLights)
                this.parts.stopLights.visible = true

            if(this.parts.backLights)
            {
                this.parts.backLights.visible = true
                this.parts.backLights.material = this.game.materials.getFromName('emissiveOrangeRadialGradient')
            }
        }
        else
        {
            if(this.parts.stopLights)
                this.parts.stopLights.visible = false

            if(this.parts.backLights)
            {
                // Backward
                if(this.game.player.accelerating < 0)
                {
                    this.parts.backLights.visible = true
                    this.parts.backLights.material = this.backLights.material
                }
                // Backward
                else
                {
                    this.parts.backLights.visible = false
                }
            }
        }

        // Boost trails
        const trailAlpha = physicalVehicle.goingForward && this.game.player.boosting && this.game.player.accelerating > 0 ? 1 : 0
        this.boostTrails.leftReference.getWorldPosition(this.boostTrails.left.position)
        this.boostTrails.left.alpha = trailAlpha
        this.boostTrails.rightReference.getWorldPosition(this.boostTrails.right.position)
        this.boostTrails.right.alpha = trailAlpha

        // Boost animation
        this.boostAnimation.mix += (this.game.player.boosting ? 1 : - 1) * this.game.ticker.deltaScaled * this.boostAnimation.speed
        this.boostAnimation.mix = clamp(this.boostAnimation.mix, 0, 1)
        // this.boostAnimation.mixUniform.value = remapClamp(this.boostAnimation.mix, 0, 0.2, 0, 1)
        this.boostAnimation.mixUniform.value = 1 - Math.pow(1 - this.boostAnimation.mix, 7)
        if(this.parts.energy)
        {
            this.parts.cell1.position.y = remapClamp(this.boostAnimation.mix, 0, 0.6, 0.2, 0)
            this.parts.cell3.position.y = remapClamp(this.boostAnimation.mix, 0.2, 0.8, 0.2, 0)
            this.parts.cell2.position.y = remapClamp(this.boostAnimation.mix, 0.4, 1, 0.2, 0)
        }

        // Screen position
        const vector = new THREE.Vector3()
        vector.setFromMatrixPosition(this.parts.chassis.matrixWorld)
        vector.project(this.game.view.camera)

        this.screenPosition.x = (vector.x * 0.5 + 0.5)
        this.screenPosition.y = (vector.y * -0.5 + 0.5)
    }
}