"""Run existing skin checks concurrently and record measured wall time, without promoting art."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
import time

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'tomato-sister-art-source'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('actor')
    parser.add_argument('skin')
    parser.add_argument('--skill-check', required=True, help='Existing actor checker filename in scripts/')
    parser.add_argument('--workers', type=int, choices=(1, 2, 3), default=3)
    args = parser.parse_args()
    for value in (args.actor, args.skin):
        if not value or any(c not in 'abcdefghijklmnopqrstuvwxyz0123456789_' for c in value):
            parser.error('Expected a plain actor/skin id')
    skill = ROOT / 'scripts' / args.skill_check
    if skill.parent != ROOT / 'scripts' or not skill.is_file() or skill.suffix != '.mjs':
        parser.error('Expected an existing checker directly under scripts/')
    output = SOURCE / 'qa' / 'pipeline' / args.skin
    output.mkdir(parents=True, exist_ok=True)
    jobs = [
        ('playback', ['node', 'scripts/check-player-skin-animation.mjs', args.actor, args.skin],
         ROOT / f'reports/art-pilot/skin-{args.skin}-animation-native.json', 3),
        ('facing', ['node', 'scripts/check-locomotion-correction.mjs', args.actor, args.skin],
         ROOT / f'reports/art-pilot/direction-audit/{args.skin}-runtime.json', 3),
        ('skill', ['node', str(skill), args.skin],
         ROOT / f'reports/art-pilot/{args.skin}-skill-motion-native.json', 6),
    ]

    def run(job):
        name, command, report, expected_cases = job
        start = time.time()
        log = output / f'{name}.log'
        result = {'name': name, 'command': command, 'log': str(log), 'report': str(report)}
        try:
            with log.open('w') as stream:
                proc = subprocess.run(command, cwd=ROOT, stdout=stream, stderr=subprocess.STDOUT,
                                      timeout=600, check=False)
            result['exitCode'] = proc.returncode
            data = json.loads(report.read_text()) if report.exists() else {}
            fresh = report.exists() and report.stat().st_mtime >= start - 1
            result['passed'] = (proc.returncode == 0 and fresh and data.get('status') == 'passed'
                                and not data.get('errors') and len(data.get('cases', [])) == expected_cases)
            result['freshReport'] = fresh
        except (OSError, ValueError, subprocess.TimeoutExpired) as error:
            result.update(passed=False, error=str(error))
        result['seconds'] = round(time.time() - start, 2)
        return result

    start = time.time()
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        results = list(pool.map(run, jobs))
    summary = {'actor': args.actor, 'skinId': args.skin,
               'at': datetime.now(timezone.utc).isoformat(), 'workers': args.workers,
               'seconds': round(time.time() - start, 2), 'checks': results,
               'status': 'passed' if all(r['passed'] for r in results) else 'failed',
               'scope': 'Existing runtime checks only; no source gait, visual or final acceptance promotion.'}
    path = ROOT / f'reports/art-pilot/{args.skin}-pipeline.json'
    path.write_text(json.dumps(summary, indent=2) + '\n')
    print(json.dumps(summary, indent=2), flush=True)
    return 0 if summary['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
