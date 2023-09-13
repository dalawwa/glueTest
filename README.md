# glueTest

- create a local .env file at the root level with

  - AWS_REGION={myRegion}
  - AWS_ACCOUNT={myAccountId}

- manually put the ranking.csv file in rawBucket
- in the glue console, run the crawler
- query the glue database in athena

  - configure the output of athena queries with the s3 path from processedBucket (one time operation)

# TODO

- automatically trigger crawler when new objects arrive in rawBucket
- add ETL job
- add monitoring and alerts
- implement other stack with the L2 constructs
- check how much of the manual steps we can automate

# Other

[quicksight as code](https://medium.com/@gmournos/aws-quicksight-as-code-a-unified-approach-for-quicksight-development-and-deployment-using-aws-30bbb6bd253a)

[example reference implementation in python](https://github.com/ChildishGirl/glue-data-pipeline)
