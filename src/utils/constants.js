export const PARTICLE_COLORS = ['#F4B8CC', '#F8D840', '#9B72CF', '#E8758A', '#ffffff'];

export const PREVIEW_POSITIONS = [
  {x:'32%',y:'5%'},{x:'55%',y:'0%'},{x:'12%',y:'18%'},{x:'68%',y:'15%'},
  {x:'42%',y:'-5%'},{x:'8%',y:'5%'},{x:'72%',y:'28%'},{x:'22%',y:'32%'},
];

// Helper to format the image string cleanly for the UI labels (e.g. 'rose_red.png' -> 'Rose Red')
export const formatImageName = (filename) => {
  if (!filename) return '';
  return filename.split('.')[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};