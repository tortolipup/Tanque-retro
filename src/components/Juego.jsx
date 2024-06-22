import React, { useEffect } from "react";
import "../style/Juego.css";

import { useJuego } from "../context/useJuego";

const Juego = () => {
  const {
    viento,
    turno,
    canones,
    setCanones,
    anchoPantalla,
    setAnchoPantalla,
    altoPantalla,
    setAltoPantalla,
    bala,
    haColisionado,
    tanqueDerribado,
    montañas,
    fuerzaMaximaCañon,
    fuerzaMinimaCañon,
    disparar,
    moverBala,
    calcularLongitudCanon,
    juegoNuevo,
    alturaPlataforma,
    impacto,
    moverSoundRef,
  } = useJuego();



  // Manejar el redimensionamiento de la ventana
  const handleResize = () => {
    setAnchoPantalla(window.innerWidth);
    setAltoPantalla(window.innerHeight);
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Manejar el evento de disparo al presionar la tecla "Space"

  // En el useEffect que maneja el movimiento de la bala, agregar una dependencia al estado de colisión:
  useEffect(() => {
    if (!haColisionado && bala) {
      const frameId = requestAnimationFrame(moverBala);
      return () => cancelAnimationFrame(frameId);
    }
  }, [bala, haColisionado]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      //   setTecla(`tecla: ${event.key} - ${event.code}`);

      moverSoundRef.currentTime = 0; // Reinicia el sonido
      moverSoundRef.play();

      switch (event.key) {
        case "ArrowUp":
          setCanones((prevCanones) => {
            const newCanones = [...prevCanones];
            newCanones[turno].fuerza = Math.min(
              newCanones[turno].fuerza + 0.1,
              fuerzaMaximaCañon
            ); // Aumenta la fuerza hasta un máximo de 5
            return newCanones;
          });
          break;
        case "ArrowDown":
          setCanones((prevCanones) => {
            const newCanones = [...prevCanones];
            newCanones[turno].fuerza = Math.max(
              newCanones[turno].fuerza - 0.1,
              fuerzaMinimaCañon
            ); // Disminuye la fuerza hasta un mínimo de 1
            return newCanones;
          });
          break;
        case "ArrowRight":
          setCanones((prevCanones) => {
            const newCanones = [...prevCanones];
            if (newCanones[turno].angulo > 0) {
              newCanones[turno].angulo -= 1;
            }
            return newCanones;
          });
          break;
        case "ArrowLeft":
          setCanones((prevCanones) => {
            const newCanones = [...prevCanones];
            if (newCanones[turno].angulo < 180) {
              newCanones[turno].angulo += 1;
            }
            return newCanones;
          });
          break;
        case "Enter":
          haColisionado ? juegoNuevo() : disparar();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [turno, bala, haColisionado]);

  useEffect(() => {
    juegoNuevo();
  }, []);

  const formatearViento = (viento) => {
    if (viento === 0) {
      return `0 km/h`;
    }

    const velocidadAbsoluta = Math.abs(viento);
    const simbolos = Math.ceil(velocidadAbsoluta / 10);
    const direccion = viento > 0 ? ">" : "<";

    return `${direccion.repeat(simbolos)} ${velocidadAbsoluta} km/h`;
  };

  return (
    <div className="contenedor">
      <div className="viento">
        <span>{formatearViento(viento)}</span>
      </div>

      <svg
        className="escenario"
        width={anchoPantalla}
        height={altoPantalla}
        viewBox={`0 0 ${anchoPantalla} ${altoPantalla}`}
      >
        {montañas &&
          montañas.map((montaña, index) => (
            <polygon
              className="montaña"
              key={index}
              points={`${montaña.p1x},${montaña.p1y} ${montaña.p2x},${montaña.p2y} ${montaña.p3x},${montaña.p3y} ${montaña.p4x},${montaña.p4y} ${montaña.p5x},${montaña.p5y} ${montaña.p6x},${montaña.p6y} ${montaña.p7x},${montaña.p7y}`}
            />
          ))}
        {alturaPlataforma.map((altura, index) => (
          <g key={index}>
            <g
              className={"tanque"}
              transform={`translate(${
                index === 0 ? anchoPantalla * 0.025 : anchoPantalla * 0.925
              },${altoPantalla - altura - 20})`}
            >
              <rect width={anchoPantalla * 0.05} height="20" />
              <line
                className={index === turno ? "canon activo" : "canon"}
                x1={(anchoPantalla * 0.05) / 2} // Ajuste de la posición X para el cañón
                y1={-2}
                x2={
                  (anchoPantalla * 0.05) / 2 +
                  calcularLongitudCanon(canones[index].fuerza) *
                    Math.cos((canones[index].angulo * Math.PI) / 180)
                } // Ajuste de la posición X para el cañón final
                y2={
                  -2 -
                  calcularLongitudCanon(canones[index].fuerza) *
                    Math.sin((canones[index].angulo * Math.PI) / 180)
                }
              />
            </g>
          </g>
        ))}
        {bala && (
          <circle
            className="bala"
            cx={bala.posicionX}
            cy={bala.posicionY}
            r="5"
          />
        )}
        {impacto && (
          <circle className="impacto" cx={impacto.x} cy={impacto.y} r="12" />
        )}
      </svg>
      {haColisionado && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2>Ganó el Jugador {tanqueDerribado === 0 ? 2 : 1}</h2>
            <button onClick={() => juegoNuevo()}>Juego Nuevo</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Juego;
