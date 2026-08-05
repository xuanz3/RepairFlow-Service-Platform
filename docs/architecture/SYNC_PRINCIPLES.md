# Synchronisation Principles

1. User actions succeed locally before network availability is considered.
2. Every outbound mutation has a stable operation identifier.
3. Repeating the same operation returns the previous result.
4. Entities carry server versions and deletion tombstones.
5. Append-only evidence and comments merge automatically.
6. Status, assignment and descriptive fields use explicit conflict handling.
7. Failed operations remain visible and actionable.
8. Application termination cannot discard committed local work.
