import { useCallback, useRef, useState } from "react";

// Evita que un formulario se envíe dos veces: mientras el primer envío no termina, los siguientes
// se ignoran y `pending` queda en true para deshabilitar el botón. La referencia bloquea en el mismo
// instante del click (el estado recién se actualiza en el próximo render, y un doble click rápido entra antes).
//
//   const { lock, pending } = useSubmitLock();
//   <form onSubmit={lock(handleSubmit)}> ... <button type="submit" disabled={pending} aria-busy={pending}>
export function useSubmitLock() {
  const running = useRef(false);
  const [pending, setPending] = useState(false);

  const lock = useCallback(
    (handler) => async (event, ...rest) => {
      event?.preventDefault?.();
      if (running.current) return undefined;
      running.current = true;
      setPending(true);
      try {
        return await handler(event, ...rest);
      } finally {
        running.current = false;
        setPending(false);
      }
    },
    [],
  );

  return { lock, pending };
}
