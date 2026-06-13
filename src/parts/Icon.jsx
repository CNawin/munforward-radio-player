export const Icon = {
  prev: (p) => <svg width={26} height={26} viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M6 5h2v14H6V5zm3 7l9 7V5l-9 7z"/></svg>,
  next: (p) => <svg width={26} height={26} viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M16 5h2v14h-2V5zM6 5l9 7-9 7V5z"/></svg>,
  play: (p) => <svg width={26} height={26} viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M8 5v14l11-7L8 5z"/></svg>,
  pause: (p) => <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M7 5h4v14H7V5zm6 0h4v14h-4V5z"/></svg>,
  stop: (p) => <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor" {...p}><rect x="6" y="6" width="12" height="12" rx="1.5"/></svg>,
  chevL: (p) => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 6l-6 6 6 6"/></svg>,
  chevR: (p) => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 6l6 6-6 6"/></svg>,
  star: (p) => <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7L12 2z"/></svg>,
  starO: (p) => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" {...p}><path d="M12 3l2.7 5.8 6.3.6-4.8 4.2 1.4 6.2L12 16.9 6.4 19.8l1.4-6.2L3 9.4l6.3-.6L12 3z"/></svg>,
};
