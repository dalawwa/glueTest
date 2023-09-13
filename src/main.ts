import { App, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as glue from "aws-cdk-lib/aws-glue";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import "dotenv/config";

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    //create raw data bucket to be crawled by glue
    const rawBucket = new s3.Bucket(this, "glueRawBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    //create processed data bucket to write athena query results
    const glueProcessedBucket = new s3.Bucket(this, "glueProcessedBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    //create glue cralwer role to access S3 bucket
    const crawlerRole = new iam.Role(this, "glue-crawler-role", {
      roleName: "AWSGlueServiceRole-AccessS3Bucket",
      description:
        "Assigns the managed policy AWSGlueServiceRole to AWS Glue Crawler so it can crawl S3 buckets",
      managedPolicies: [
        iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          "glue-service-policy",
          "arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole"
        ),
      ],
      assumedBy: new iam.ServicePrincipal("glue.amazonaws.com"),
    });

    //add permissions the crawler's role to write cloudwatch logs
    crawlerRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["logs:PutLogEvents"],
        resources: ["arn:aws:logs:*:*:*"],
      })
    );

    rawBucket.grantRead(crawlerRole);
    glueProcessedBucket.grantWrite(crawlerRole);

    //create glue database
    new glue.CfnDatabase(this, "glue-workflow-db", {
      catalogId: process.env.AWS_ACCOUNT!,
      databaseInput: {
        name: "test-glue-database",
        description: "test-glue-database",
      },
    });

    //create glue crawler
    new glue.CfnCrawler(this, "glueCrawler", {
      name: "test-glue-crawler",
      role: crawlerRole.roleArn,
      databaseName: "test-glue-database",
      targets: {
        s3Targets: [
          {
            path: rawBucket.bucketName,
          },
        ],
      },
      tablePrefix: "my_dummy_prefix_",
      schemaChangePolicy: {
        updateBehavior: "UPDATE_IN_DATABASE",
        deleteBehavior: "LOG",
      },
    });
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, "glueTest-dev", { env: devEnv });
// new MyStack(app, 'glueTest-prod', { env: prodEnv });

app.synth();
