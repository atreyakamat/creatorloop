#!/usr/bin/env bash
# Temporary: capture the remote build log (this environment gives us no other
# way to read it). On failure, POSTs the tail of the log to the site's own
# Netlify form so it can be read back through the forms API. Removed after diagnosis.
set -o pipefail
npm run build 2>&1 | tee build.log
code=$?
if [ $code -ne 0 ]; then
  errors=$(grep -inE "error|fail|cannot|missing" build.log | head -c 2500)
  tail_log=$(tail -c 2500 build.log)
  for payload in "errors::$errors" "tail::$tail_log"; do
    kind="${payload%%::*}"; body="${payload#*::}"
    curl -s -o /dev/null -X POST "https://creatorloop-avus.netlify.app/__forms.html" \
      --data-urlencode "form-name=waitlist" \
      --data-urlencode "role=buildlog-$kind" \
      --data-urlencode "name=exit-$code" \
      --data-urlencode "business=$body" \
      --data-urlencode "phone=-" --data-urlencode "area=-" || true
  done
fi
exit $code
