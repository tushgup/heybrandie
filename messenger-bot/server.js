var request = require("request");
var http = require("http");
var express = require("express");
var bodyParser = require("body-parser");
var compression = require("compression");
var fetch = require("node-fetch");

var conf = require("./conf");

var app = express();
app.use(compression());
app.set("case sensitive routing", true);
app.use(bodyParser.json());

var httpServer = http.createServer(app);

app.get("/", function(req, res, next) {
	res.send("Welcome to the Brandie Messenger Bot. This is root endpoint!");
});

app.get("/webhook/", handleVerify);


function handleVerify(req, res, next) {
	var token = process.env.VERIFY_TOKEN || conf.VERIFY_TOKEN;
	if (req.query["hub.verify_token"] === token) {
		return res.send(req.query["hub.challenge"]);
	}
	res.send("Validation failed, Verify token mismatch");
}

function firstEntity(nlp, name) {
  return nlp && nlp.entities && nlp.entities[name] && nlp.entities[name][0];
}

function handleMessage(sender_psid, received_message) {
	let response;
		if (received_message.quick_reply) {
			handlePostback(sender_psid, received_message.quick_reply);
		}
		else if(received_message.nlp)
		{
			console.log(received_message.nlp.entities);
			const nlpGreeting = firstEntity(received_message.nlp, 'greetings');
			const nlpBye = firstEntity(received_message.nlp,'bye');
			const nlpThx = firstEntity(received_message.nlp,'thanks');
			if(nlpGreeting && nlpGreeting.confidence > 0.85)
			{
				response = {
					text:
						"Hey there! I'll walk you through the various parts that go into establishing your professional presence online.",
					quick_replies: [
						{
							content_type: "text",
							title: "Okay, let's go!",
							payload: "understood_Yes"
						},
						{
							content_type: "text",
							title: "Um? What?",
							payload: "understood_No"
						}
					]
				};
			}
			else if(nlpBye && nlpBye.confidence > 0.85)
			{
				response = {
					text: "Bye bye! 👋 I'll be available 24x7 if you need me."
				};
			}
			else if(nlpThx && nlpThx.confidence > 0.85)
			{
				response = {
					text: "You're welcome 😁! Feel free to explore more by playing around."
				};
			}
			else {
				response = {
					text:
						"I'm so sorry, I didn't understand your last input. How can I help?",
					quick_replies: [
						{
							content_type: "text",
							title: "Start Over",
							payload: "<postback_payload>"
						},
						{
							content_type: "text",
							title: "Personal Websites",
							payload: "understood_Yes"
						},
						{
							content_type: "text",
							title: "Writing Blogs",
							payload: "blog_question"
						},
						{
							content_type: "text",
							title: "LinkedIn Tips",
							payload: "linkedin_no"
						},
						{
							content_type: "text",
							title: "Twitter Hacks",
							payload: "twitter_question"
						}
					]
				};
			}
		}
	else if (received_message.attachments) {
		response = {
			text:
				"I'm so sorry, I didn't understand your last input. How can I help?",
			quick_replies: [
				{
					content_type: "text",
					title: "Personal Websites",
					payload: "<postback_payload>"
				},
				{
					content_type: "text",
					title: "Start Over",
					payload: "understood_Yes"
				},
				{
					content_type: "text",
					title: "Writing Blogs",
					payload: "blog_question"
				},
				{
					content_type: "text",
					title: "LinkedIn Tips",
					payload: "linkedin_no"
				},
				{
					content_type: "text",
					title: "Twitter Hacks",
					payload: "twitter_question"
				}
			]
		};
	}
	callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
	let response;
	let response1;
	let response2;
	// Get the payload for the postback
	let payload = received_postback.payload;

	console.log("Postback received was: " + payload);

	// Set the response based on the postback payload
	if (payload == "<postback_payload>") {
		response = {
			text:
				"Hey there! I'll walk you through the various parts that go into establishing your professional presence online.",
			quick_replies: [
				{
					content_type: "text",
					title: "Okay, let's go!",
					payload: "understood_Yes"
				},
				{
					content_type: "text",
					title: "Um? What?",
					payload: "understood_No"
				}
			]
		};
		callSendAPI(sender_psid, response);
	} else if (payload == "understood_Yes") {
		response = {
			attachment: {
				type: "template",
				payload: {
					template_type: "button",
							text:
								"Do you currently have a personal website?",
							buttons: [
								{
									type: "postback",
									title: "Yes, duh!",
									payload: "website_yes"
								},
								{
									type: "postback",
									title: "Working on it..",
									payload: "website_wip"
								},
								{
									type: "postback",
									title: "Nope, not yet",
									payload: "website_no"
								}
							]
						}
			}
		};
		response1 = {
			text: "Having a personal website makes it simple for others to find you online. Even the most basic of websites, having just contact information go a long way in improving discovery."
		};
		callSendAPI(sender_psid, response1).then(() => {
			return callSendAPI(sender_psid,response);
		});
	} else if (payload == "understood_No") {
		response = {
			attachment: {
				type: "template",
				payload: {
					template_type: "generic",
					elements: [
						{
							title:
								"Alrighty then, are you ready?",
							buttons: [
								{
									type: "postback",
									title: "Okay, help me!",
									payload: "understood_Yes"
								}
							]
						}
					]
				}
			}
		};
		response1 = {
			text: "No worries, let me try to explain what I do. I'm Brandie and I'll help you cross some basic requirements off your to-do list while preparing to get into the professional workforce."
		};
		response2 = {
			text: "Even though we use the Internet everyday, we often underestimate how many opportunities it can lead us to - just by making ourselves accessible and discoverable to professionals & recruiters through the right channels."
		};
		callSendAPI(sender_psid, response1).then(() => {
			return callSendAPI(sender_psid,response2).then(() => {
				return callSendAPI(sender_psid,response);
			});
		});
	} else if (payload == "website_yes") {
		response = {
			attachment: {
				type: "template",
				payload: {
					template_type: "button",
					text:
						"Great! Let's analyse your website to see if you can do anything better.",
					buttons: [
						{
							type: "web_url",
							url: "https://developers.google.com/speed/pagespeed/insights/",
							title: "Analyse Website"
						}
					]
				}
			}
		};
		response1 = {
			attachment: {
				type: "template",
				payload: {
					template_type: "button",
					text: "I hope that helped in finding some areas of improvement, want a complete list of must-have website sections?",
				buttons: [
					{
						type: "postback",
						payload: "website_wip",
						title: "Sure!"
					},
					{
						type: "postback",
						payload: "blog_question",
						title: "What's next?"
					}
				]
			}
		}
	};
		callSendAPI(sender_psid, response).then(() => {
			return callSendAPI(sender_psid,response1);
		});
	} else if (payload == "website_wip") {
		//console.log("Website WIP Payload!");
		response = {
      attachment: {
				type: "template",
				payload: {
					template_type: "list",
          top_element_style: "large",
					elements: [
						{
							title:
								"The Ultimate Guide To Building A Personal Website",
              subtitle: "Follow along this comprehensive guide.",
              image_url: "https://collegeinfogeek.com/wp-content/uploads/2017/01/build-personal-website-2017.jpg",
							buttons: [
								{
									type: "web_url",
									title: "Read",
									url: "https://collegeinfogeek.com/personal-website/"
								}
							]
						},
            {
              title:
								"12 Tips on How to Build A Personal Website that Will Land Your Dream Job",
              subtitle: "Some helpful tips that make sure your website contains the right information!",
              image_url: "https://images.onmogul.com/uploads/story/thumbnail/44399/312868c15c.jpg?ixlib=rails-0.3.2&ch=Width%2CDPR&fit=crop&h=465&w=820&s=7b5fa2b2b4a97473415489b8b86b36a0",
							buttons: [
								{
									type: "web_url",
									title: "Read",
									url: "https://onmogul.com/stories/12-tips-on-how-to-build-a-personal-website-that-will-land-your-dream-job"
								}
							]
            },
            {
              title:
                "6 Do's and Don'ts For Your Personal Website",
              subtitle: "Don't make these rookie mistakes!",
              image_url: "https://pilbox.themuse.com/image.jpg?url=https%3A%2F%2Fassets.themuse.com%2Fuploaded%2Fattachments%2F14784.jpg%3Fv%3DNone&h=367",
              buttons: [
                {
                  type: "web_url",
                  title: "Read",
                  url: "https://www.themuse.com/advice/6-things-you-should-put-on-your-personal-websiteand-6-things-to-avoid-at-all-costs"
                }
              ]
            }
					]
				}
			}
    };
		response1 = {
			attachment: {
				type: "template",
				payload: {
					template_type: "button",
					text: "All great things take time. Hope you keep these tips in mind before publishing your website!",
				buttons: [
					{
						type: "postback",
						payload: "blog_question",
						title: "Okay, next!"
					}
				]
			}
		}
	};
		callSendAPI(sender_psid, response).then(() => {
			return callSendAPI(sender_psid,response1);
		});
  }
  else if(payload== 'website_no')
  {
    response = {
      attachment: {
				type: "template",
				payload: {
					template_type: "button",
					text:
						"Do you have any experience building websites? Know HTML/CSS/Javascript?",
					buttons: [
						{
							type: "postback",
							payload: "html_pro",
							title: "Ofcourse, I'm a pro."
						},
            {
              type: "postback",
              payload: "html_noob",
              title: "No, I don't."
            }
					]
				}
			}
    };
		callSendAPI(sender_psid, response);
  }
	else if(payload== 'html_pro')
	{
		response = {
			attachment: {
				type: "template",
				payload: {
					template_type: "generic",
					elements: [
						{
							title:
								"Step 1: Static Website Templates!",
							subtitle: "Choose from these beautiful templates as a starting point.",
              image_url: "https://html5up.net/uploads/images/ethereal.jpg",
							buttons: [
								{
									type: "web_url",
									title: "Choose one!",
									url: "https://html5up.net/"
								}
							]
						},
            {
              title:
								"Step 2: Github Pages",
							subtitle: "Easiest hosting setup ever.",
              image_url: "https://pages.github.com/images/slideshow/jekyllrb.png",
							buttons: [
								{
									type: "web_url",
									title: "Free hosting!",
									url: "https://pages.github.com"
								}
							]
            },
						{
              title:
								"Step 3: Free .me domain!",
							subtitle: "Redeem your student education pack and get free goodies! You just need a photo of your ID card.",
              image_url: "https://hackhands.com/assets/img/education/github-bag.png",
							buttons: [
								{
									type: "web_url",
									title: "Get the pack!",
									url: "https://education.github.com/pack"
								}
							]
						}
          ]
				}
			}
		};
		response1 = {
			attachment: {
				type: "template",
				payload: {
					template_type: "button",
					text: "These three steps will definitely help you getting all set towards having a great website! ^.^ But I know you can be lazy at times, wanna check some quicker alternatives?",
				buttons: [
					{
						type: "postback",
						payload: "html_noob",
						title: "Hmm, why not?"
					},
					{
						type: "postback",
						payload: "blog_question",
						title: "No, I ain't lazy."
					}
				]
			}
		}
	};
		callSendAPI(sender_psid, response).then(() => {
			return callSendAPI(sender_psid,response1);
		});
}
else if(payload== 'html_noob')
{
	response = {
		attachment: {
			type: "template",
			payload: {
				template_type: "generic",
				elements: [
					{
						title:
							"Option 1: Carrd.co",
						subtitle: "2 minute setup. Responsive & customizable.",
						image_url: "https://carrd.co/assets/images/landing/site-2.jpg",
						buttons: [
							{
								type: "web_url",
								title: "Start now!",
								url: "https://carrd.co"
							}
						]
					},
					{
						title:
							"Option 2: About.me",
						subtitle: "Present yourself with one click.",
						image_url: "https://cdn.about.me/s3/h/z/5275676c.png",
						buttons: [
							{
								type: "web_url",
								title: "Automatic generator!",
								url: "https://about.me"
							}
						]
					},
					{
						title:
							"Option 3: Strikingly",
						subtitle: "One-page website builder!",
						image_url: "https://static-assets.strikinglycdn.com/images/landing2/twitter-card.jpg",
						buttons: [
							{
								type: "web_url",
								title: "Highly Customizable!",
								url: "https://www.strikingly.com"
							}
						]
					}
				]
			}
		}
	};
	response1 = {
		attachment: {
			type: "template",
			payload: {
				template_type: "button",
				text: "Alrighty! We look all good to go. Your personal website is now a reality! Woohoo.",
			buttons: [
				{
					type: "postback",
					payload: "blog_question",
					title: "What's next!?"
				}
			]
		}
	}
};
	callSendAPI(sender_psid, response).then(() => {
		return callSendAPI(sender_psid,response1);
	});
}
else if(payload== 'blog_question')
{
	response = {
		attachment: {
			type: "template",
			payload: {
				template_type: "button",
				text:
					"A well-formed blog is like a resume that’s constantly updating itself. Do you currently have a personal blog?",
				buttons: [
					{
						type: "postback",
						payload: "blog_yes",
						title: "Yeah, ofcourse!"
					},
					{
						type: "postback",
						payload: "blog_no",
						title: "Nope."
					}
				]
			}
		}
	};
	callSendAPI(sender_psid, response);
}
else if(payload== 'blog_no')
{
	response = {
		attachment: {
			type: "template",
			payload: {
				template_type: "list",
				top_element_style: "large",
				elements: [
					{
						title:
							"Why You Should Start a Blog",
						subtitle: "Even if you're not a writer.",
						image_url: "https://goinswriter.com/wp-content/uploads/start-blog-630x394.jpg",
						buttons: [
							{
								type: "web_url",
								title: "Read",
								url: "https://goinswriter.com/why-blog/"
							}
						]
					},
					{
						title:
							"Should I Start a Blog?",
						subtitle: "A must read on a blog's benefits.",
						image_url: "https://howtostartablogonline.net/wp-content/uploads/2015/01/why-blog.jpg",
						buttons: [
							{
								type: "web_url",
								title: "Read",
								url: "https://howtostartablogonline.net/why-blog/"
							}
						]
					},
					{
						title:
							"Starting a blog in College!",
						subtitle: "A well-formed blog is like a resume that’s constantly updating itself.",
						image_url: "https://collegeinfogeek.com/wp-content/uploads/2013/03/learning_pyramid-600x445.jpg",
						buttons: [
							{
								type: "web_url",
								title: "Read",
								url: "https://collegeinfogeek.com/reasons-to-start-a-blog/"
							}
						]
					}
				]
			}
		}
	};
	response1 = {
		text: "Do consider starting a blog, it's a great way to build up a network with like-minded individuals and get some discovery! You can talk about your opinions, reviews, or even technical guides! Here are some of the best blogging websites right now!"
	}
	response2 = {
		attachment: {
			type: "template",
			payload: {
				template_type: "generic",
				elements: [
					{
						title:
							"Medium.com",
						subtitle: "Great community built in!",
						image_url: "https://contentinsights.com/blog/wp-content/uploads/2017/01/Whats-next-for-Medium.jpg",
						buttons: [
							{
								type: "web_url",
								title: "Get Started",
								url: "https://medium.com"
							},
							{
								type: "postback",
								title: "Next Step",
								payload: "linkedin_question"
							}
						]
					},
					{
						title:
							"WordPress",
						subtitle: "Highly customizable!",
						image_url: "https://s.w.org/about/images/logos/wordpress-logo-stacked-rgb.png",
						buttons: [
							{
								type: "web_url",
								title: "Start blogging!",
								url: "https://wordpress.com"
							},
							{
								type: "postback",
								title: "Next Step",
								payload: "linkedin_question"
							}
						]
					},
					{
						title:
							"Tumblr",
						subtitle: "Something for everyone.",
						image_url: "https://scontent.fbom3-1.fna.fbcdn.net/v/t1.0-9/15823283_10155052309808738_4205003756954116403_n.jpg?oh=240db0f42b8c4f031d4288004f5c305e&oe=5AC7F9DC",
						buttons: [
							{
								type: "web_url",
								title: "Sign up!",
								url: "https://tumblr.com"
							},
							{
								type: "postback",
								title: "Next Step",
								payload: "linkedin_question"
							}
						]
					}
				]
			}
		}
	};
	callSendAPI(sender_psid, response).then(() => {
		return callSendAPI(sender_psid,response1).then(() => {
			return callSendAPI(sender_psid,response2);
		});
	});
}
else if(payload== 'blog_yes')
{
	response = {
		text: "That's awesome news. Remember to keep your blog updated with regards to fields that interest you. This could include writing tutorials, sharing experiences or just opinions on certain topics!"
	};
	response1 = {
		attachment: {
			type: "template",
			payload: {
				template_type: "button",
				text:
					"Keep going? You can come back later - I'll always be here!",
				buttons: [
					{
						type: "postback",
						payload: "linkedin_question",
						title: "Give me more!"
					}
				]
			}
		}
	};
	callSendAPI(sender_psid, response).then(() => {
		return callSendAPI(sender_psid,response1);
	});
}
else if(payload== 'linkedin_question')
{
		response = {
			attachment: {
				type: "template",
				payload: {
					template_type: "button",
					text:
						"Do you have a well-updated LinkedIn profile?",
					buttons: [
						{
							type: "postback",
							payload: "linkedin_yes",
							title: "Yes, ofcourse!"
						},
						{
							type: "postback",
							payload: "linkedin_no",
							title: "Not really"
						}
					]
				}
			}
		};
		callSendAPI(sender_psid, response);
}
else if(payload== 'linkedin_yes')
{
	response = {
		text: "That's great news. Always make sure you have an updated profile + lots of connections/endorsements! They go a long way in improving recruiters coming across you. (Trust me, it makes a difference!)"
	};
	response1 = {
		text:
			"Do you still want to take a look at some of the tips I have for LinkedIn?",
		quick_replies: [
			{
				content_type: "text",
				title: "Sure!",
				payload: "linkedin_no"
			},
			{
				content_type: "text",
				title: "No, what's next?",
				payload: "twitter_question"
			}
		]
	};
	callSendAPI(sender_psid, response).then(() => {
		return callSendAPI(sender_psid,response1);
	});
}
else if(payload== 'linkedin_no')
{
	response = {
		attachment: {
			type: "template",
			payload: {
				template_type: "list",
				top_element_style: "large",
				elements: [
					{
						title:
							"The Complete Guide to LinkedIn",
						subtitle: "All you need to know.",
						image_url: "https://www.yesware.com/wp-content/uploads/linkedin-profile-background-photo-examples.png",
						buttons: [
							{
								type: "web_url",
								title: "Read",
								url: "https://www.yesware.com/blog/linkedin-profile/"
							}
						]
					},
					{
						title:
							"9 Simple Tips to Supercharge Your LinkedIn",
						subtitle: "Follow along!",
						image_url: "https://fthmb.tqn.com/dX9Tyt1JsJBigQXumo5a2W37x4Y=/768x0/filters:no_upscale()/man-using-a-digital-tablet-547544123-58a0c55b3df78c475801fe6d.jpg",
						buttons: [
							{
								type: "web_url",
								title: "Read",
								url: "https://www.thebalance.com/tips-to-make-a-better-linkedin-profile-2062332"
							}
						]
					},
					{
						title:
							"7 Tweaks for LinkedIn",
						subtitle: "The small things that make a huge difference!",
						image_url: "http://cdn.skim.gs/images/c_fill,dpr_1.0,f_auto,fl_lossy,h_391,q_auto,w_695/x5idkpsyxcue5pixcvtx/linkedin-profile-tweaks",
						buttons: [
							{
								type: "web_url",
								title: "Read",
								url: "http://www.sheknows.com/living/articles/1136609/linkedin-profile-tweaks"
							}
						]
					},
					{
						title:
							"5-step guide for a Bomb LinkedIn Profile",
						subtitle: "Make recruiters love you!",
						image_url: "http://www.thedailystar.net/sites/default/files/styles/big_6/public/feature/images/step.jpg?itok=WGWUcoQz&c=9de2bc54fad6159d0f27af8c7592da92",
						buttons: [
							{
								type: "web_url",
								title: "Read",
								url: "http://www.thedailystar.net/next-step/5-step-guide-bomb-linkedin-profile-1495600"
							}
						]
					}
				]
			}
		}
	};
	response1 = {
		attachment: {
			type: "template",
			payload: {
				template_type: "button",
				text:
					"Great! Make sure your LinkedIn profile has all of this and come back to me!",
				buttons: [
					{
						type: "postback",
						payload: "twitter_question",
						title: "Done! What's next?"
					}
				]
			}
		}
	};
	callSendAPI(sender_psid, response).then(() => {
		return callSendAPI(sender_psid,response1);
	});
}
else if(payload== 'twitter_question')
{
	response = {
		attachment: {
			type: "template",
			payload: {
				template_type: "button",
				text:
					"Do you use Twitter frequently for interacting with professionals?",
				buttons: [
					{
						type: "postback",
						payload: "twitter_yes",
						title: "Yes, ofcourse!"
					},
					{
						type: "postback",
						payload: "twitter_no",
						title: "Not really"
					}
				]
			}
		}
	};
	callSendAPI(sender_psid, response);
}
else if(payload== 'twitter_no')
{
	response = {
		text: "Twitter is great for following your favourite celebrities & memes, but it is an even better tool to build your network. Following relevant people in the your niche, interacting with them when possible, and staying active in that community can open up new doors for you. Here are some hacks to supercharge your Twitter network!"
	};
	response2 = {
		text: "Even if you're not comfortable interacting with them right away, even by just following them - you get an insight of how their work ethic and opinions. All you need to do is just follow them! :D"
	}
	response1 = {
		attachment: {
			type: "template",
			payload: {
				template_type: "generic",
				elements: [
					{
						title:
							"Growing your personal brand on Twitter",
						subtitle: "Tips from the experts.",
						image_url: "https://marketingland.com/wp-content/ml-loads/2014/07/twitter-bird-1920-800x450.jpg",
						buttons: [
							{
								type: "web_url",
								title: "Read",
								url: "https://marketingland.com/how-to-grow-your-personal-brand-on-twitter-in-only-10-minutes-a-day-121514"
							},
							{
								type: "postback",
								title: "Next Step",
								payload: "fin"
							}
						]
					},
					{
						title:
							"Strong personal branding on Twitter",
						subtitle: "6 steps to ensure it!",
						image_url: "https://d28dwf34zswvrl.cloudfront.net/wp-content/uploads/2017/02/5-brand-identity.png",
						buttons: [
							{
								type: "web_url",
								title: "Read",
								url: "https://yourstory.com/2017/02/strong-brand-identity-twitter/"
							},
							{
								type: "postback",
								title: "Next Step",
								payload: "fin"
							}
						]
					},
					{
						title:
							"Twitter Lists",
						subtitle: "Find the community for your niche.",
						image_url: "https://assets.pcmag.com/media/images/430060-get-organized-twitter-list.jpg?thumb=y&width=810&height=456",
						buttons: [
							{
								type: "web_url",
								title: "Search!",
								url: "https://www.scoutzen.com/twitter-lists/search"
							},
							{
								type: "postback",
								title: "Next Step",
								payload: "fin"
							}
						]
					},
					{
						title:
							"Bio Search",
						subtitle: "Find relevant people based on their bios",
						image_url: "https://startacus.net/uploads/image/Twitter-birds.jpg",
						buttons: [
							{
								type: "web_url",
								title: "Start blogging!",
								url: "https://moz.com/followerwonk/bio"
							},
							{
								type: "postback",
								title: "Next Step",
								payload: "fin"
							}
						]
					}
				]
			}
		}
	};
	callSendAPI(sender_psid, response).then(() => {
		return callSendAPI(sender_psid,response2).then(() => {
			return callSendAPI(sender_psid, response1);
		});
	});
}
else if(payload== 'twitter_yes')
{
	response = {
		text: "That's great news! Make sure you interact with relevant people in your industry and stay active inside the community. It goes a long way in building connections with like-minded industry professionals."
	};
	response1 = {
		attachment: {
			type: "template",
			payload: {
				template_type: "button",
				text:
					"Now that your Twitter is all set, let's move on.",
				buttons: [
					{
						type: "postback",
						payload: "fin",
						title: "Yeah, what's next?"
					}
				]
			}
		}
	};
	callSendAPI(sender_psid, response).then(() => {
		return callSendAPI(sender_psid,response1);
	});
}
else if(payload== 'fin')
{
	response = {
		text: "That's all I have for now. Thanks for using Brandie! 👋 I'll be available 24x7 if you need me! Like the page for more finely tuned branding tips and tricks!"
	}
	response1 = {
		attachment: {
			type: "template",
			payload: {
				template_type: "generic",
				elements: [
					{
						title: "I just used Brandie to supercharge my personal brand!",
						subtitle: "You should try it too! It makes a tailored plan for every user.",
						image_url: "http://www.tushargupta.me/assets/img/Brandie_Share.png",
						buttons: [
							{
								type: "element_share",
								share_contents: {
									attachment: {
										type: "template",
										payload: {
											template_type: "generic",
											elements: [
												{
													title: "I just used Brandie to supercharge my personal brand!",
													subtitle: "You should try it too! It makes a tailored plan for every user.",
													image_url: "http://www.tushargupta.me/assets/img/Brandie_Share.png",
													default_action: {
														type: "web_url",
														url: "https://m.me/heybrandie"
													},
													buttons: [
														{
															type: "web_url",
															url: "https://m.me/heybrandie",
															title: "Get Started"
														}
													]
												}
											]
										}
									}
								}
							}
						]
					}
				]
			}
		}
	};
	callSendAPI(sender_psid, response).then(() => {
		return callSendAPI(sender_psid,response1);
	});
}
}
// Sends response messages via the Send API

function callSendAPI(sender_psid, response) {
	let body = {
		messaging_type: "response",
		recipient: {
			id: sender_psid
		},
		message: response
	};
	const qs = conf.PROFILE_TOKEN;
	return fetch('https://graph.facebook.com/me/messages?access_token=' + qs, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	}).then(rsp => rsp.json()).then(json => {
      console.log(json);
  });
}

app.post("/webhook", (req, res) => {
	// Parse the request body from the POST
	let body = req.body;
	// Check the webhook event is from a Page subscription
	if (body.object === "page") {
		// Iterate over each entry - there may be multiple if batched
		body.entry.forEach(function(entry) {
			// Gets the body of the webhook event
			let webhook_event = entry.messaging[0];
			console.log(webhook_event);

			// Get the sender PSID
			let sender_psid = webhook_event.sender.id;
			//console.log("Sender PSID: " + sender_psid);

			//console.log('QuickReply Payload: ' + webhook_event.message.quick_reply);

			// Check if the event is a message or postback and
			// pass the event to the appropriate handler function
			if (webhook_event.message) {
				handleMessage(sender_psid, webhook_event.message);
			} else if (webhook_event.postback) {
				handlePostback(sender_psid, webhook_event.postback);
			}
		});
		// Return a '200 OK' response to all events
		res.status(200).send("EVENT_RECEIVED");
	} else {
		// Return a '404 Not Found' if event is not from a page subscription
		res.sendStatus(404);
	}
});

var port = process.env.PORT || 5000;
httpServer.listen(port, function() {
	console.log("Express http server listening on port " + port);
});
