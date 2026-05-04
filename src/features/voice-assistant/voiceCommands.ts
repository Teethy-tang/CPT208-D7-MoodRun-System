export type VoiceRunCommand =
  | 'cancelStop'
  | 'confirmStop'
  | 'distance'
  | 'muteVoice'
  | 'pace'
  | 'resumeVoice'
  | 'status'
  | 'stopRun'
  | 'time'
  | 'unknown';

export function parseVoiceRunCommand(transcript: string): VoiceRunCommand {
  const text = normalizeTranscript(transcript);
  if (!text) return 'unknown';

  if (matchesAny(text, ['cancel', 'never mind', 'do not stop', 'dont stop', '取消', '不用', '不要', '别停'])) {
    return 'cancelStop';
  }

  if (matchesAny(text, ['confirm stop', 'yes stop', 'confirm', 'yes', '确定', '确认', '确认停止', '是的'])) {
    return 'confirmStop';
  }

  if (matchesAny(text, ['mute voice', 'voice off', 'turn off voice', 'be quiet', '关闭语音', '语音关闭', '静音', '别说话'])) {
    return 'muteVoice';
  }

  if (
    matchesAny(text, [
      'resume voice',
      'voice on',
      'turn on voice',
      'enable voice',
      '打开语音',
      '恢复语音',
      '继续语音',
      '语音打开',
    ])
  ) {
    return 'resumeVoice';
  }

  if (matchesAny(text, ['stop run', 'end run', 'finish run', 'stop running', '结束跑步', '停止跑步', '结束运动'])) {
    return 'stopRun';
  }

  if (
    matchesAny(text, [
      'how am i doing',
      'how am i',
      'status',
      'update',
      'report',
      '现在怎么样',
      '我怎么样',
      '状态',
      '情况',
      '表现',
    ])
  ) {
    return 'status';
  }

  if (matchesAny(text, ['distance', 'how far', 'far', '跑了多少', '多少公里', '距离', '里程'])) {
    return 'distance';
  }

  if (matchesAny(text, ['pace', 'speed', '配速', '速度', '跑得多快'])) {
    return 'pace';
  }

  if (matchesAny(text, ['time', 'duration', 'how long', '多久', '跑了多久', '时间', '用时'])) {
    return 'time';
  }

  return 'unknown';
}

function matchesAny(text: string, phrases: string[]) {
  return phrases.some((phrase) => text.includes(phrase));
}

function normalizeTranscript(value: string) {
  return value
    .toLowerCase()
    .replace(/[?!.,;:，。！？；：]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
