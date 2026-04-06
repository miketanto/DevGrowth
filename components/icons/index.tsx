import Svg, {
  Path,
  Rect,
  Circle,
  Line,
  Polyline,
  Polygon,
  Ellipse,
} from 'react-native-svg';
import { colors } from '../../theme/colors';

interface IconProps {
  size?: number;
  color?: string;
}

// ─── App Logo ───
export function LogoIcon({ size = 32, color = colors.teal }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path
        d="M8 8h4v4H8zM14 8h4v4h-4zM20 8h4v4h-4zM8 14h4v4H8zM20 14h4v4h-4zM8 20h4v4H8zM14 20h4v4h-4zM20 20h4v4h-4z"
        fill={color}
        opacity={0.3}
      />
      <Path d="M14 14h4v4h-4z" fill={color} />
      <Path
        d="M6 6l20 0v20H6z"
        stroke={color}
        strokeWidth={1.5}
        fill="none"
      />
    </Svg>
  );
}

// ─── Tab Icons ───
export function TabTodayIcon({ size = 22, color = colors.textDim }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x={3} y={4} width={18} height={18} rx={3} />
      <Line x1={3} y1={10} x2={21} y2={10} />
      <Line x1={9} y1={2} x2={9} y2={6} />
      <Line x1={15} y1={2} x2={15} y2={6} />
      <Circle cx={12} cy={15} r={1.5} fill={color} stroke="none" />
    </Svg>
  );
}

export function TabJourneyIcon({
  size = 22,
  color = colors.textDim,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <Path d="M12 20V4M12 4l-5 5M12 4l5 5" />
      <Circle cx={12} cy={20} r={1.5} fill={color} stroke="none" />
    </Svg>
  );
}

export function TabSkillsIcon({
  size = 22,
  color = colors.textDim,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <Path d="M12 2L3 7l9 5 9-5-9-5z" />
      <Path d="M3 12l9 5 9-5" />
      <Path d="M3 17l9 5 9-5" />
    </Svg>
  );
}

export function TabLibraryIcon({
  size = 22,
  color = colors.textDim,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <Path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      <Line x1={9} y1={7} x2={16} y2={7} />
      <Line x1={9} y1={11} x2={14} y2={11} />
    </Svg>
  );
}

// ─── Content Icons ───
export function FireIcon({ size = 20, color = colors.amber }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C8 7 4 10 4 14a8 8 0 0016 0c0-4-4-7-8-12z"
        fill={color}
        opacity={0.2}
        stroke={color}
        strokeWidth={1.5}
      />
      <Path
        d="M12 9c-2 3-4 4.5-4 7a4 4 0 008 0c0-2.5-2-4-4-7z"
        fill={color}
        opacity={0.5}
      />
    </Svg>
  );
}

export function CheckIcon({ size = 12, color = colors.teal }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

export function XIcon({ size = 10, color = colors.rose }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
    >
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  );
}

export function PlusIcon({ size = 18, color = colors.bg }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
    >
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function ArrowLeftIcon({
  size = 16,
  color = colors.textMuted,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    >
      <Path d="M19 12H5M5 12l6-6M5 12l6 6" />
    </Svg>
  );
}

export function ArrowUpIcon({ size = 10, color = colors.bg }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
    >
      <Path d="M12 20V4M12 4l-5 5M12 4l5 5" />
    </Svg>
  );
}

export function ChatIcon({ size = 16, color = colors.blue }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    >
      <Path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </Svg>
  );
}

export function BookmarkIcon({ size = 16, color = colors.amber }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      stroke={color}
      strokeWidth={2}
    >
      <Path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </Svg>
  );
}

export function StarIcon({ size = 20, color = colors.amber }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} opacity={0.9}>
      <Polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.5 5.8 21 7 14 2 9.3 9 8.5" />
    </Svg>
  );
}

export function ZapIcon({ size = 20, color = colors.teal }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </Svg>
  );
}

export function TrophyIcon({ size = 20, color = colors.amber }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <Path d="M6 9H4a2 2 0 01-2-2V5h4M18 9h2a2 2 0 002-2V5h-4" />
      <Path d="M6 5h12v5a6 6 0 01-12 0V5z" />
      <Path d="M12 16v3M8 22h8M8 19h8" />
    </Svg>
  );
}

export function TargetIcon({ size = 20, color = colors.blue }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <Circle cx={12} cy={12} r={10} />
      <Circle cx={12} cy={12} r={6} />
      <Circle cx={12} cy={12} r={2} />
    </Svg>
  );
}

export function BookIcon({ size = 16, color = colors.purple }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <Path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
      <Path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </Svg>
  );
}

export function FilmIcon({ size = 16, color = colors.purple }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <Rect x={2} y={2} width={20} height={20} rx={2.18} />
      <Line x1={7} y1={2} x2={7} y2={22} />
      <Line x1={17} y1={2} x2={17} y2={22} />
      <Line x1={2} y1={12} x2={22} y2={12} />
      <Line x1={2} y1={7} x2={7} y2={7} />
      <Line x1={2} y1={17} x2={7} y2={17} />
      <Line x1={17} y1={7} x2={22} y2={7} />
      <Line x1={17} y1={17} x2={22} y2={17} />
    </Svg>
  );
}

export function FileTextIcon({ size = 16, color = colors.blue }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <Polyline points="14 2 14 8 20 8" />
      <Line x1={16} y1={13} x2={8} y2={13} />
      <Line x1={16} y1={17} x2={8} y2={17} />
    </Svg>
  );
}

export function CodeIcon({ size = 16, color = colors.teal }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <Polyline points="16 18 22 12 16 6" />
      <Polyline points="8 6 2 12 8 18" />
    </Svg>
  );
}

export function GraduationIcon({
  size = 16,
  color = colors.purple,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <Path d="M22 10l-10-6L2 10l10 6 10-6z" />
      <Path d="M6 12v5c3 3 9 3 12 0v-5" />
    </Svg>
  );
}

// ─── Skill Branch Icons ───
export function BranchLangIcon({
  size = 14,
  color = colors.blue,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    >
      <Polyline points="16 18 22 12 16 6" />
      <Polyline points="8 6 2 12 8 18" />
    </Svg>
  );
}

export function BranchFrameworkIcon({
  size = 14,
  color = colors.purple,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    >
      <Rect x={3} y={3} width={7} height={7} />
      <Rect x={14} y={3} width={7} height={7} />
      <Rect x={14} y={14} width={7} height={7} />
      <Rect x={3} y={14} width={7} height={7} />
    </Svg>
  );
}

export function BranchDevopsIcon({
  size = 14,
  color = colors.teal,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    >
      <Circle cx={12} cy={12} r={3} />
      <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </Svg>
  );
}

export function BranchDBIcon({ size = 14, color = colors.amber }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    >
      <Ellipse cx={12} cy={5} rx={9} ry={3} />
      <Path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <Path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </Svg>
  );
}

// ─── Misc Icons ───
export function LockIcon({ size = 14, color = colors.rose }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    >
      <Rect x={3} y={11} width={18} height={11} rx={2} />
      <Path d="M7 11V7a5 5 0 0110 0v4" />
    </Svg>
  );
}

export function PencilIcon({ size = 20, color = colors.text }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <Path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </Svg>
  );
}

export function ShieldIcon({ size = 20, color = colors.purple }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  );
}

export function SeedIcon({ size = 20, color = colors.teal }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <Path d="M12 22V12M12 12C12 7 7 2 2 2c0 5 5 10 10 10zM12 12c0-5 5-10 10-10 0 5-5 10-10 10z" />
    </Svg>
  );
}

export function DiamondIcon({ size = 20, color = colors.blue }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Polygon points="6 3 18 3 22 9 12 22 2 9" />
    </Svg>
  );
}
