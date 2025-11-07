#!/usr/bin/env bash

DEFAULT_USERNAME="neo4j"
DEFAULT_PASSWORD="neo4j"
NEW_PASSWORD="Really_Secure_Local_Db_Password"

# Update Neo4j config, then restart Neo4j
sudo service neo4j restart
sleep 15s   # Wait 15s to let the neo4j service restart!

# Change the default neo4j password
# (default is 'neo4j', but needs changing before schema changes can be made!)
echo "CALL dbms.changePassword('$NEW_PASSWORD');" | cypher-shell -u $DEFAULT_USERNAME -p $DEFAULT_PASSWORD

INIT_SCRIPT="/vagrant/neo4j/init.cypher"

if [ -f "$INIT_SCRIPT" ]; then
  echo "Running Neo4j initialization script located at $INIT_SCRIPT"
  if cypher-shell -u $DEFAULT_USERNAME -p $NEW_PASSWORD -f "$INIT_SCRIPT"; then
    exit 0
  fi
  echo "Initialization script failed, falling back to legacy inline commands"
fi

# Setup indexes as per https://github.com/noduslabs/infranodus/wiki/Neo4J-Database-Setup
INDICIES="
  CREATE INDEX ON :User(name);
  CREATE INDEX ON :User(uid);
  CREATE INDEX ON :Concept(name);
  CREATE INDEX ON :Concept(uid);
  CREATE INDEX ON :Context(name);
  CREATE INDEX ON :Context(uid);
  CREATE INDEX ON :Context(by);
  CREATE INDEX ON :Statement(name);
  CREATE INDEX ON :Statement(uid);
  CREATE INDEX to_context IF NOT EXISTS FOR ()-[r:TO]-() ON (r.context);
  CREATE INDEX to_statement IF NOT EXISTS FOR ()-[r:TO]-() ON (r.statement);
  CREATE INDEX to_user IF NOT EXISTS FOR ()-[r:TO]-() ON (r.user);
  CREATE INDEX at_context IF NOT EXISTS FOR ()-[r:AT]-() ON (r.context);
  CREATE INDEX at_statement IF NOT EXISTS FOR ()-[r:AT]-() ON (r.statement);
  CREATE INDEX at_user IF NOT EXISTS FOR ()-[r:AT]-() ON (r.user);
  CREATE INDEX by_context IF NOT EXISTS FOR ()-[r:BY]-() ON (r.context);
  CREATE INDEX by_statement IF NOT EXISTS FOR ()-[r:BY]-() ON (r.statement);
  CREATE INDEX by_user IF NOT EXISTS FOR ()-[r:BY]-() ON (r.user);
  CREATE INDEX of_context IF NOT EXISTS FOR ()-[r:OF]-() ON (r.context);
  CREATE INDEX of_user IF NOT EXISTS FOR ()-[r:OF]-() ON (r.user);
  CREATE INDEX in_context IF NOT EXISTS FOR ()-[r:IN]-() ON (r.context);
  CREATE INDEX in_user IF NOT EXISTS FOR ()-[r:IN]-() ON (r.user);
"
echo $INDICIES | cypher-shell -u $DEFAULT_USERNAME -p $NEW_PASSWORD

# Setup relationship fulltext indexes for compatibility with db.index.fulltext.queryRelationships
REL_FULLTEXT="
  CREATE FULLTEXT INDEX to_context_fulltext IF NOT EXISTS FOR ()-[r:TO]-() ON EACH [r.context];
  CREATE FULLTEXT INDEX to_statement_fulltext IF NOT EXISTS FOR ()-[r:TO]-() ON EACH [r.statement];
  CREATE FULLTEXT INDEX to_user_fulltext IF NOT EXISTS FOR ()-[r:TO]-() ON EACH [r.user];
  CREATE FULLTEXT INDEX at_context_fulltext IF NOT EXISTS FOR ()-[r:AT]-() ON EACH [r.context];
  CREATE FULLTEXT INDEX at_statement_fulltext IF NOT EXISTS FOR ()-[r:AT]-() ON EACH [r.statement];
  CREATE FULLTEXT INDEX at_user_fulltext IF NOT EXISTS FOR ()-[r:AT]-() ON EACH [r.user];
  CREATE FULLTEXT INDEX by_context_fulltext IF NOT EXISTS FOR ()-[r:BY]-() ON EACH [r.context];
  CREATE FULLTEXT INDEX by_statement_fulltext IF NOT EXISTS FOR ()-[r:BY]-() ON EACH [r.statement];
  CREATE FULLTEXT INDEX by_user_fulltext IF NOT EXISTS FOR ()-[r:BY]-() ON EACH [r.user];
  CREATE FULLTEXT INDEX of_context_fulltext IF NOT EXISTS FOR ()-[r:OF]-() ON EACH [r.context];
  CREATE FULLTEXT INDEX of_user_fulltext IF NOT EXISTS FOR ()-[r:OF]-() ON EACH [r.user];
  CREATE FULLTEXT INDEX in_context_fulltext IF NOT EXISTS FOR ()-[r:IN]-() ON EACH [r.context];
  CREATE FULLTEXT INDEX in_user_fulltext IF NOT EXISTS FOR ()-[r:IN]-() ON EACH [r.user];
"
echo $REL_FULLTEXT | cypher-shell -u $DEFAULT_USERNAME -p $NEW_PASSWORD
