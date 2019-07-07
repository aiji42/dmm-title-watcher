FROM chybie/node-aws-cli
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY

# install serverless framework
RUN npm install -g serverless

# set aws key
RUN sls config credentials --provider aws --key $AWS_ACCESS_KEY_ID --secret $AWS_SECRET_ACCESS_KEY

RUN mkdir -p /app
WORKDIR /app