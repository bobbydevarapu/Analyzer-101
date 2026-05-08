import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  CheckCircle2,
  XCircle,
} from "lucide-react";

type Props = {
  show: boolean;
  message: string;
  type?: "success" | "error";
};

const GlassToast = ({
  show,
  message,
  type = "success",
}: Props) => {

  // =====================================================
  // AUTO FIX SUCCESS / ERROR TYPE
  // =====================================================

  const normalizedType: "success" | "error" =

    type === "error" &&

    /sent successfully|successfully sent|success|✅/i.test(
      message
    )

      ? "success"

      : type;

  const isSuccess =
    normalizedType === "success";

  // =====================================================
  // COMPONENT
  // =====================================================

  return (

    <AnimatePresence>

      {show && (

        <motion.div

          initial={{
            opacity: 0,
            y: -25,
            scale: 0.94,
          }}

          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}

          exit={{
            opacity: 0,
            y: -20,
            scale: 0.96,
          }}

          transition={{
            duration: 0.25,
            ease: "easeOut",
          }}

          className="
            fixed
            z-[999999]

            top-3
            left-3
            right-3

            sm:top-5
            sm:right-5
            sm:left-auto

            flex
            justify-center

            sm:block
          "
        >

          <div

            className={`

              relative
              overflow-hidden

              w-full
              sm:w-[420px]

              rounded-3xl
              border

              backdrop-blur-2xl
              shadow-[0_20px_60px_rgba(0,0,0,0.45)]

              px-4
              py-4

              sm:px-5
              sm:py-5

              flex
              items-center
              gap-3

              ${

                isSuccess

                  ? `
                    border-emerald-400/30
                    bg-emerald-500/15
                    text-emerald-100
                  `

                  : `
                    border-rose-400/30
                    bg-rose-500/15
                    text-rose-100
                  `
              }
            `}
          >

            {/* ===================================== */}
            {/* BACKGROUND GLOW */}
            {/* ===================================== */}

            <div

              className={`

                absolute
                inset-0

                opacity-20
                blur-3xl

                ${
                  isSuccess
                    ? "bg-emerald-500"
                    : "bg-rose-500"
                }
              `}
            />

            {/* ===================================== */}
            {/* ICON */}
            {/* ===================================== */}

            <div

              className={`

                relative
                z-10

                flex
                h-11
                w-11

                flex-shrink-0

                items-center
                justify-center

                rounded-2xl

                ${
                  isSuccess

                    ? `
                      bg-emerald-500/20
                      text-emerald-300
                    `

                    : `
                      bg-rose-500/20
                      text-rose-300
                    `
                }
              `}
            >

              {

                isSuccess

                  ? (

                    <CheckCircle2
                      className="
                        h-5
                        w-5
                      "
                    />

                  )

                  : (

                    <XCircle
                      className="
                        h-5
                        w-5
                      "
                    />

                  )
              }

            </div>

            {/* ===================================== */}
            {/* MESSAGE */}
            {/* ===================================== */}

            <div
              className="
                relative
                z-10
                min-w-0
                flex-1
              "
            >

              <p

                className="
                  break-words
                  text-[13px]
                  sm:text-sm
                  font-semibold
                  leading-relaxed
                "
              >
                {message}
              </p>

            </div>

          </div>

        </motion.div>
      )}

    </AnimatePresence>
  );
};

export default GlassToast;