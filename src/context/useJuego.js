import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

import disparoSound from "../sounds/disparo.mp3";
import colisionSound from "../sounds/colision.mp3";
import colisionEnemigoSound from "../sounds/colisionEnemigo.mp3";
import colisionPropiaSound from "../sounds/colisionPropia.mp3";
import moverSound from "../sounds/mover.mp3";
const disparoSoundRef = new Audio(disparoSound);
const colisionSoundRef = new Audio(colisionSound);
const colisionEnemigoSoundRef = new Audio(colisionEnemigoSound);
const colisionPropiaSoundRef = new Audio(colisionPropiaSound);
const moverSoundRef = new Audio(moverSound);

const JuegoContext = createContext();

export const JuegoProvider = ({ children }) => {
    const [viento, setViento] = useState(0);
    const [turno, setTurno] = useState(0);
    const [canones, setCanones] = useState([
        { angulo: 45, fuerza: 5 },
        { angulo: 135, fuerza: 5 },
    ]);
    const [anchoPantalla, setAnchoPantalla] = useState(window.innerWidth);
    const [altoPantalla, setAltoPantalla] = useState(window.innerHeight);
    const [bala, setBala] = useState(null);
    const [alturaPlataforma, setAlturaPlataforma] = useState([0, 0]);
    const [puedeDisparar, setPuedeDisparar] = useState(true);
    const [haColisionado, setHaColisionado] = useState(false);
    const [tanqueDerribado, setTanqueDerribado] = useState(null);
    const [montañas, setMontañas] = useState(null);
    const [impacto, setImpacto] = useState(null); // Estado para la posición del impacto
 

    const alturaPlataformaRef = useRef(alturaPlataforma);
    const canonesRef = useRef(canones);

    const influenciaViento = 0.1;
    const influenciaGravedad = 9.81 * 4;
    const fuerzaMaximaCañon = 20;
    const fuerzaMinimaCañon = 5;
    const fotogramasXsegundo = 400;

    // Función para sortear el viento
    const sortearViento = () => {
        const velocidad = Math.floor(Math.random() * 50) + 1;
        const direccion = Math.random() < 0.5 ? 1 : -1;
        setViento(velocidad * direccion);
    };

    // Función para cambiar el turno
    const cambiarTurno = () => {
        setTurno((turnoAnterior) => (turnoAnterior === 0 ? 1 : 0));
        setPuedeDisparar(true); // Restablecer la capacidad de disparar
        sortearViento();
    };

    //juego nuevo
    const juegoNuevo = () => {
        setHaColisionado(false);
        setBala(null);
        setCanones([
            { angulo: 45, fuerza: 5 },
            { angulo: 135, fuerza: 5 },
        ]);
        sortearViento();
        setPuedeDisparar(true);
        setTurno(0);
        sortearEscenario();
    };

    // Función para calcular la longitud del cañón
    const calcularLongitudCanon = (fuerza) => {
        const LONGITUD_MIN_CANON = 25;
        const LONGITUD_MAX_CANON = 55;
        return (
            LONGITUD_MIN_CANON +
            (fuerza - 1) * ((LONGITUD_MAX_CANON - LONGITUD_MIN_CANON) / 20)
        );
    };

    const sortearEscenario = () => {
        const altura1 = Math.random() * (altoPantalla * 0.3);
        const altura2 = Math.random() * (altoPantalla * 0.3);
        setAlturaPlataforma([altura1, altura2]);

        const plataforma1Altura = Math.max(altura1, altura2);
        const alturaSorteada = altoPantalla - Math.random() * (altoPantalla * 0.75);
        const alturaMinima = altoPantalla - plataforma1Altura - altoPantalla * 0.3;

        // Altura de la cresta de cada montaña (aleatoria pero dentro de los límites)
        const alturaCresta1 = Math.min(alturaMinima, alturaSorteada);

        // Guardar las coordenadas de las montañas en el estado
        setMontañas([
            {
                p1x: 0,
                p1y: altoPantalla - altura1 + 3,
                p2x: anchoPantalla * 0.1,
                p2y: altoPantalla - altura1 + 3,
                p3x: anchoPantalla / 2,
                p3y: alturaCresta1,
                p4x: anchoPantalla - anchoPantalla * 0.1,
                p4y: altoPantalla - altura2 + 3,
                p5x: anchoPantalla,
                p5y: altoPantalla - altura2 + 3,
                p6x: anchoPantalla,
                p6y: altoPantalla,
                p7x: 0,
                p7y: altoPantalla,
            },
        ]);
    };

    // Función para disparar la bala
    const disparar = () => {
        if (puedeDisparar && bala === null) {
            const longitudCañon = calcularLongitudCanon(canonesRef.current[turno].fuerza);
            const anguloRadianes = (canonesRef.current[turno].angulo * Math.PI) / 180;
            const cañonX = turno === 0 ? anchoPantalla * 0.05 : anchoPantalla * 0.95;
            const cañonY = altoPantalla - alturaPlataformaRef.current[turno] - 23;
            const balaInicialX = cañonX + longitudCañon * Math.cos(anguloRadianes);
            const balaInicialY = cañonY - longitudCañon * Math.sin(anguloRadianes);

            // Usar la fuerza del cañón para determinar la velocidad de la bala
            const velocidadBala = canonesRef.current[turno].fuerza;
            const velocidadX =
                velocidadBala * Math.cos(anguloRadianes) +
                (viento * influenciaViento) / fotogramasXsegundo;
            const velocidadY = -velocidadBala * Math.sin(anguloRadianes);

            setBala({
                posicionX: balaInicialX,
                posicionY: balaInicialY,
                velocidadX,
                velocidadY,
            });
            setPuedeDisparar(false);

            // Reproducir sonido de disparo
            disparoSoundRef.currentTime = 0; // Reinicia el sonido
            disparoSoundRef.play();
        }
    };

    useEffect(() => { 
        //por alguna razon, alturaPlataforma no se actualizaba solo en la funcion disparar, por eso hice esta chanchada
        alturaPlataformaRef.current = alturaPlataforma;
    }, [alturaPlataforma]);

    useEffect(() => {
        //por alguna razon, alturaPlataforma no se actualizaba solo en la funcion disparar, por eso hice esta chanchada
        canonesRef.current = canones;
    }, [canones]);


    // Función para mover la bala
    const moverBala = () => {
        if (bala) {
            const nuevaVelocidadX =
                bala.velocidadX + (viento * influenciaViento) / fotogramasXsegundo;
            const nuevaVelocidadY =
                bala.velocidadY + influenciaGravedad / fotogramasXsegundo;
            const nuevaPosicionX = bala.posicionX + nuevaVelocidadX;
            const nuevaPosicionY = bala.posicionY + nuevaVelocidadY;

            // Verificar colisión fuera de la pantalla

            if ((nuevaPosicionX < 0 && nuevaPosicionY > altoPantalla - alturaPlataforma[0]) ||
                (nuevaPosicionX > anchoPantalla && nuevaPosicionY > altoPantalla - alturaPlataforma[1])
            ) {

                //guardamos la posicion de la colicion
                lugarImpacto(nuevaPosicionX, nuevaPosicionY);

                // Reproduce sonido de colisión
                colisionSoundRef.currentTime = 0;
                colisionSoundRef.play();

                cambiarTurno();
                setBala(null);
                return;
            }

            // Verificar colisión con el suelo de la pantalla
            if (nuevaPosicionY >= altoPantalla) {

                //guardamos la posicion de la colicion
                lugarImpacto(nuevaPosicionX, nuevaPosicionY);

                // Reproduce sonido de colisión
                colisionSoundRef.currentTime = 0;
                colisionSoundRef.play();

                cambiarTurno();
                setBala(null);
                return;
            }

            // Definir las posiciones de los tanques en función del turno actual
            const [posicionTanqueJugador, posicionTanqueEnemigo] =
                turno === 0
                    ? [anchoPantalla * 0.025, anchoPantalla * 0.925]
                    : [anchoPantalla * 0.925, anchoPantalla * 0.025];

            const anchoTanque = anchoPantalla * 0.05;
            const altoTanque = 20;

            // Colisión con el tanque del jugador
            const colisionJugador =
                nuevaPosicionX >= posicionTanqueJugador &&
                nuevaPosicionX <= posicionTanqueJugador + anchoTanque &&
                nuevaPosicionY >= altoPantalla - alturaPlataforma[turno] - altoTanque &&
                nuevaPosicionY <= altoPantalla - alturaPlataforma[turno];

            // Colisión con el tanque enemigo
            const colisionEnemigo =
                nuevaPosicionX >= posicionTanqueEnemigo &&
                nuevaPosicionX <= posicionTanqueEnemigo + anchoTanque &&
                nuevaPosicionY >=
                altoPantalla - alturaPlataforma[1 - turno] - altoTanque &&
                nuevaPosicionY <= altoPantalla - alturaPlataforma[1 - turno];

            if (colisionJugador) {
                console.log("Colisión con el tanque del jugador");

                setTanqueDerribado(turno);
                colisionPropiaSoundRef.currentTime = 0; // Reinicia el sonido
                colisionPropiaSoundRef.play(); // Reproduce el sonido

            } else if (colisionEnemigo) {
                console.log("Colisión con el tanque enemigo");

                setTanqueDerribado(1 - turno); // Se derribó el tanque del turno actual
                colisionEnemigoSoundRef.currentTime = 0; // Reinicia el sonido
                colisionEnemigoSoundRef.play(); // Reproduce el sonido
            }

            if (colisionJugador || colisionEnemigo) {
                // Dejar la bala quieta en la posición de colisión
                lugarImpacto(nuevaPosicionX, nuevaPosicionY);

                // Establecer el estado de colisión
                setHaColisionado(true);
                return;
            }

            // Verificar colisión con la montaña
            if (montañas) {
                if (verificarColisionMontaña(nuevaPosicionX, nuevaPosicionY)) {
                    //guardamos la posicion de la colicion
                    lugarImpacto(nuevaPosicionX, nuevaPosicionY);

                    // Reproduce sonido de colisión
                    colisionSoundRef.currentTime = 0;
                    colisionSoundRef.play();
                    // Elimina la bala
                    setBala(null);
                    // Cambia el turno
                    cambiarTurno();
                    return;
                }
            }

            // Si no hay colisiones, actualizar la posición de la bala
            setBala((prevBala) => ({
                ...prevBala,
                posicionX: nuevaPosicionX,
                posicionY: nuevaPosicionY,
                velocidadX: nuevaVelocidadX,
                velocidadY: nuevaVelocidadY,
            }));
        }
    };

    // Función para verificar la colisión con la montaña
    const verificarColisionMontaña = (posicionX, posicionY) => {
        if (!montañas) return false;
        for (const mont of montañas) {
            for (let i = 1; i <= 4; i++) {
                // Verificar colisión con el segmento de la montaña
                const pendiente1 =
                    (mont[`p${i + 1}y`] - mont[`p${i}y`]) /
                    (mont[`p${i + 1}x`] - mont[`p${i}x`]);
                const interseccion1 =
                    mont[`p${i + 1}y`] - pendiente1 * mont[`p${i + 1}x`];
                const yLinea1 = pendiente1 * posicionX + interseccion1;

                // Verificar si la bala está por debajo de las líneas de la montaña
                if (
                    posicionX >= mont[`p${i}x`] &&
                    posicionX <= mont[`p${i + 1}x`] &&
                    posicionY >= yLinea1
                ) {
                    return true;
                }
            }
        }
        return false;
    };

    const lugarImpacto = (x, y) => {
        //guardamos la posicion de la colicion
        const posicionImpacto = { x: x, y: y };
        setImpacto(posicionImpacto);

        // Eliminamos la explosión después de 1 segundo
        setTimeout(() => {
            setImpacto(null);
        }, 2000);
    };

    return (
        <JuegoContext.Provider
            value={{
                viento,
                setViento,
                turno,
                setTurno,
                canones,
                setCanones,
                alturaPlataforma,
                setAlturaPlataforma,
                anchoPantalla,
                setAnchoPantalla,
                altoPantalla,
                setAltoPantalla,
                bala,
                setBala,
                puedeDisparar,
                setPuedeDisparar,
                haColisionado,
                setHaColisionado,
                tanqueDerribado,
                setTanqueDerribado,
                montañas,
                setMontañas,
                influenciaViento,
                influenciaGravedad,
                fuerzaMaximaCañon,
                fuerzaMinimaCañon,
                fotogramasXsegundo,
                disparar,
                moverBala,
                sortearEscenario,
                calcularLongitudCanon,
                juegoNuevo,
                cambiarTurno,
                sortearViento,
                impacto,
                moverSoundRef,
            
            }}
        >
            {children}
        </JuegoContext.Provider>
    );
};

export const useJuego = () => useContext(JuegoContext);
