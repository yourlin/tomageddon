"""Regression checks for preserving action deformation and refusing clipped delivery frames."""
import runpy
import unittest
from pathlib import Path
from PIL import Image, ImageDraw
calibrate = runpy.run_path(str(Path(__file__).with_name('build-animation-atlas.py')))['calibrate_action']

class CalibrationTests(unittest.TestCase):
    def test_shared_scale_preserves_squash_and_foot_baseline(self):
        frames = []
        for top in [80, 110]:
            frame = Image.new('RGBA', (256, 256))
            ImageDraw.Draw(frame).rectangle((80, top, 175, 229), fill='orange')
            frames.append(frame)
        result, _ = calibrate(frames, 0, 180)
        boxes = [f.getchannel('A').point(lambda a: 255 if a >= 32 else 0).getbbox() for f in result]
        self.assertLessEqual(abs((boxes[0][3] - boxes[0][1]) - 180), 2)
        self.assertEqual(boxes[0][3], boxes[1][3])
        self.assertGreater(boxes[0][3] - boxes[0][1], boxes[1][3] - boxes[1][1])

    def test_extended_pose_cannot_be_clipped_by_calibration(self):
        neutral = Image.new('RGBA', (256, 256))
        ImageDraw.Draw(neutral).rectangle((95, 150, 160, 229), fill='orange')
        extended = Image.new('RGBA', (256, 256))
        ImageDraw.Draw(extended).rectangle((5, 150, 250, 229), fill='orange')
        with self.assertRaisesRegex(ValueError, 'clip'):
            calibrate([neutral, extended], 0, 180)

    def test_large_canvas_preserves_torso_with_overhead_weapon(self):
        neutral = Image.new('RGBA', (320, 320))
        ImageDraw.Draw(neutral).rectangle((110, 150, 210, 287), fill='orange')
        raised = neutral.copy()
        ImageDraw.Draw(raised).rectangle((90, 48, 97, 287), fill='blue')
        idle, _ = calibrate([neutral], 0, 138)
        attack, _ = calibrate([neutral, raised], 1, 240)
        def torso_box(frame):
            mask = Image.new('L', frame.size)
            mask.putdata([255 if r > 200 and g > 100 and b < 50 and a > 200 else 0
                          for r, g, b, a in frame.getdata()])
            return mask.getbbox()
        self.assertEqual(torso_box(idle[0]), torso_box(attack[0]))
        self.assertEqual(torso_box(idle[0]), torso_box(attack[1]))
        self.assertGreaterEqual(attack[1].getchannel('A').getbbox()[1], 3)

if __name__ == '__main__':
    unittest.main()
