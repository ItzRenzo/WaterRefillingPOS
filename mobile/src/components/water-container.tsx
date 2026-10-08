import Svg, { Ellipse, Path, Rect, Text } from "react-native-svg";

export default function WaterContainer({
  bottle = false,
  size = 110,
}: {
  bottle?: boolean;
  size?: number;
}) {
  return (
    <Svg
      width={size}
      height={(size * 150) / 140}
      viewBox="0 0 140 150"
      accessibilityLabel={
        bottle ? "500 mL plastic bottle" : "Standard blue gallon"
      }
    >
      <Ellipse cx="70" cy="139" rx={bottle ? 24 : 43} ry="6" fill="#dce7f4" />
      {bottle ? (
        <>
          <Rect x="57" y="9" width="26" height="12" rx="3" fill="#2575d6" />
          <Path
            d="M60 21h20v14c0 8 14 14 14 27v62q0 11-11 11H57q-11 0-11-11V62c0-13 14-19 14-27Z"
            fill="#ddf3ff"
            stroke="#88bedf"
            strokeWidth="2"
          />
          <Path d="M48 75h44v46q0 11-10 11H58q-10 0-10-11Z" fill="#a9dcf7" />
          <Path
            d="M52 66h36M51 111h38M51 117h38"
            stroke="#80bcdf"
            strokeWidth="2"
          />
          <Rect x="47" y="79" width="46" height="26" rx="2" fill="#fff" />
          <Text
            x="70"
            y="90"
            textAnchor="middle"
            fontSize="6"
            fill="#2364aa"
            fontWeight="bold"
          >
            PURIFIED
          </Text>
          <Text x="70" y="100" textAnchor="middle" fontSize="7" fill="#2364aa">
            500 mL
          </Text>
          <Path
            d="M57 43q-5 8-5 15"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <Rect x="54" y="8" width="32" height="12" rx="3" fill="#153c9d" />
          <Path
            d="M57 20h26v18q0 5 9 10l18 13q7 6 7 16v45q0 14-14 14H37q-14 0-14-14V77q0-10 7-16l18-13q9-5 9-10Z"
            fill="#347fd6"
            stroke="#1e5da9"
            strokeWidth="2"
          />
          <Path
            d="M30 80h80M29 91h82M29 118h82"
            stroke="#205ba4"
            strokeWidth="4"
          />
          <Rect x="34" y="95" width="72" height="20" rx="4" fill="#d9efff" />
          <Text
            x="70"
            y="108"
            textAnchor="middle"
            fontSize="9"
            fill="#2059a2"
            fontWeight="bold"
          >
            PURIFIED WATER
          </Text>
          <Path
            d="M46 55q-13 7-15 18v42"
            stroke="#82bafa"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <Path
            d="M86 48q17 1 17 17v13H91V64q0-5-8-5"
            fill="#eaf3fd"
            stroke="#205ba4"
            strokeWidth="2"
          />
        </>
      )}
    </Svg>
  );
}
