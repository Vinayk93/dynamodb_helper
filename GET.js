function Generic_keyCondition(hash_value,range_value,condition,FullExpression){
    var self = this;
    if(self.typeof_hash != typeof hash_value){
        throw new Error("type of hash doesnot match");
    }
    this.params['KeyCondition'] = ""+this.hash+" = '"+hash_value+"' ";
        if(range_value != undefined){
            if(typeof range_value == "object"){

            }else{
                if(self.typeof_range != typeof range_value){
                    throw new Error("type of range doesnot match");
                }
                if(condition != undefined){
                    this.params['KeyCondition'] += "AND "+this.range+" "+condition+" '"+range_value+"' ";
                }else{
                    this.params['KeyCondition'] += "AND "+this.range+" = '"+range_value+"' ";
                }
            }
        }else{

        }
        if(FullExpression){
            this.params['KeyCondition'] = FullExpression;
        }
}

function Generic_filterExpression(Expression,attribites_name_json,attribites_value_json){
    this.params['FilterExpression'] = Expression;
    this.params['ExpressionAttributeNames'] = Object.assign({},this.params.ExpressionAttributeNames,attribites_name_json);
    this.params['ExpressionAttributeValues'] = Object.assign({},this.params.ExpressionAttributeValues,attribites_value_json);
}

function Generic_sort(boolean){
    // console.log(this.params);
    this['params']['ScanIndexForward'] = Boolean(boolean);
}
function Generic_limit(number){
    this['params']['Limit'] = number;
}
function ConsistentRead(boolean){
    this['params']['ConsistentRead'] = Boolean(boolean);
}
function ExclusiveStartKey(pagination_object){
    this['params']['ExclusiveStartKey'] = pagination_object
}

class GSI_GET{
    constructor(Dynamodb_structure,full_structure,index_name){
        // this.hash = ;
        // this.range = range;
        this.TableName = full_structure.TableName;
        this.params = {
            TableName: full_structure.TableName,
            IndexName: index_name
        };

        this.index = Dynamodb_structure.IndexName;
        
        // find the attribites
        Dynamodb_structure.KeySchema.forEach((ele)=>{
            if(ele.KeyType == "HASH"){
                this.hash = ele.AttributeName;
            }
            if(ele.KeyType == "RANGE"){
                this.range = ele.AttributeName;
            }
            full_structure.AttributeDefinitions.forEach((e)=>{
                if(e.AttributeName ==  this.hash){
                    this.typeof_hash = typeof_dynamodb_to_js(e.AttributeType);
                }
                if(e.AttributeName == this.range){
                    this.typeof_range = typeof_dynamodb_to_js(e.AttributeType);
                }
            })
        });
    }

    /**
     * 
     * @param {*} hash_value 
     * @param {*} range_value 
     * @param {*} condition 
     * @param {*} FullExpression 
     */
    KeyCondition(hash_value,range_value,condition,FullExpression){
        Generic_keyCondition.call(this,hash_value,range_value,condition,FullExpression);
    }
    // can be used in reusable code
    // sort(boolean){
    //     this.params['ScanIndexForward']= Boolean(boolean);
    // }
    /**
     * filteration
     */
    filterExpression(Expression,attribites_name_json,attribites_value_json){
        Generic_filterExpression.call(this,Expression,attribites_name_json,attribites_value_json);
    }
}

function typeof_dynamodb_to_js(type,inverse){
    if(inverse == undefined){
        switch(type){
            case 'N': return "number";
                        break;
            case 'S': return "string";
                        break;
            case 'B': return 'string';
                        break;
            case 'List': 
            case 'Map': 
            case 'Set': return 'object';
                        break;
            default: return new Error("Dynamodb type not supported");
        }
    }else{
        /** from js to dynamodb */
    }
}

class GET {
    /**
     * dynamodb create table json find hash and range
     * @param {*} Dynamodb_structure 
     */
    constructor(Dynamodb_structure){
        this.TableName = Dynamodb_structure.TableName;
        this.params = {
            TableName: Dynamodb_structure.TableName
        };

        // find the attributes
        console.log(typeof Dynamodb_structure.KeySchema);
        Dynamodb_structure.KeySchema.forEach((ele)=>{
            if(ele.KeyType == "HASH"){
                this.hash = ele.AttributeName;
            }
            if(ele.KeyType == "RANGE"){
                this.range = ele.AttributeName;
            }
        });

        //find the type
        Dynamodb_structure.AttributeDefinitions.forEach((ele)=>{
            if(ele.AttributeName == this.hash){
                this.typeof_hash = typeof_dynamodb_to_js(ele.AttributeType);
            }
            if(ele.AttributeName == this.range){
                this.typeof_range = typeof_dynamodb_to_js(ele.AttributeType);
            }
        });

        // recurcive of GSI
        if(Dynamodb_structure.GlobalSecondaryIndexes){
            Dynamodb_structure.GlobalSecondaryIndexes.forEach((e,i)=>{
                if(this.GSI == undefined){
                    this.GSI = [];
                }
                this.GSI[e.IndexName]=(
                    new GSI(
                        Dynamodb_structure.GlobalSecondaryIndexes[i],
                        Dynamodb_structure,
                        e.IndexName
                        )
                    );
            })
        }

        //recurcive for LSI
        if(Dynamodb_structure.LocalSecondaryIndexes){
            Dynamodb_structure.LocalSecondaryIndexes.forEach((e,i)=>{
                if(this.LSI == undefined){
                    this.LSI = [];
                }
                this.LSI[e.IndexName]=(
                        new GSI(
                            Dynamodb_structure.LocalSecondaryIndexes[i],
                            Dynamodb_structure,
                            e.IndexName
                        )
                    );
            })
        }
    }

    /**
     * Remodify the tableName
     * @param {*} name_of_table 
     */
    TableName(name_of_table,index){
        this.TableName = name_of_table;
        this['params']['TableName'] = name_of_table;
        if(index){
            this['params']['IndexName'] = index;
        }
    }

    /**
     * Table take arguments and create a json for dynamodb
     * @param {*} hash_value 
     * @param {*} range_value 
     * @param {*} condition 
     * @param {*} FullExpression 
     */
    KeyCondition(hash_value,range_value,condition,FullExpression){
        if(typeof hash_value != this.typeof_hash ){
            throw new Error("Dynamodb hash type doesnot match");
        }
        if(range_value != undefined && typeof range_value == this.typeof_range ){
            Generic_keyCondition.call(this,hash_value,range_value,condition,FullExpression);
        }else{
            throw new Error("Dynamodb range type doesnot match");
        }
    }

    filterExpression(Expression,attribites_name_json,attribites_value_json){
        Generic_filterExpression.call(this,Expression,attribites_name_json,attribites_value_json);
    }
    // can be used in reusable code
    // sort(boolean){
    //     this.params['ScanIndexForward']= Boolean(boolean);
    // }
    // limit(number){
    //     this.params['Limit'] = number;
    // }
    excute(json){
        if(json != undefined){
            console.log("Arguments are given");
            console.log("Overwrite everything");
            this.params =  json; 
        }else{
            /** 
             * no arguments given
             * just call keySchema 
            **/
           
        }
    }
}

GET.prototype.sort = function(boolean){
    Generic_sort.call(this,boolean);
}
GET.prototype.limit = function(number){
    Generic_limit.call(this,number)
}
GET.prototype.ConsistentRead = function(boolean){
    ConsistentRead.call(this,boolean);
}
GET.prototype.ExclusiveStartKey = function(pagination_object){
    ExclusiveStartKey.call(this,pagination_object);
}

GSI_GET.prototype.sort = function(boolean){
    Generic_sort.call(this,boolean);
}
GSI_GET.prototype.limit = function(number){
    Generic_limit.call(this,number);
}
GSI_GET.prototype.ConsistentRead = function(boolean){
    ConsistentRead.call(this,boolean);
}
GSI_GET.prototype.ExclusiveStartKey = function(pagination_object){
    ExclusiveStartKey.call(this,pagination_object);
}

var Dynmodb_schema = require('./Dynamodb_schema.json');
// console.log(Dynmodb_schema.TableName);
flat = new Dynamodb_Interface(Dynmodb_schema);
// flat.KeyCondition("1",["2","2"],"BETWEEN"); //soory type is misused
flat.filterExpression("#a = a2",{"#a":"a"},{"a2":2}); //not defined data
// flat.excute({}); // url mismatch
flat.limit(1);
console.log(flat.params);

// flat.KeyCondition("","","","id = 2, s = s");
// // console.log(flat.params);

// flat.GSI.index_name_1.KeyCondition("1");
// // console.log(flat.GSI.index_name_1.params);

// flat.GSI.index_name_1.KeyCondition("1");
// flat.GSI.index_name_1.filterExpression("#a = a2 and contains(#2)",{"#a":"a"},{"a2":2,"#2":2})
// flat.GSI.index_name_1.ExclusiveStartKey({});
// flat.GSI.index_name_1.limit(1);
// console.log(flat.GSI.index_name_1.params);
